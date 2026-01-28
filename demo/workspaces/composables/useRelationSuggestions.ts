import type { RelationSuggestionRecord, RelationSuggestionInsert, CaseFieldRecord, CaseTableRecord } from '../utils/db/schema/newTableSchema'
import { getCurrentUserId } from './useCurrentUser'

// Configuration
const ANALYSIS_ROW_LIMIT = 10 // Only analyze first N rows
const MIN_MATCH_THRESHOLD = 0.5 // Require 50% match rate

interface SuggestionWithDetails extends RelationSuggestionRecord {
  sourceTableName: string
  sourceFieldName: string
  targetTableName: string
  targetFieldName: string
}

export function useRelationSuggestions() {
  const { query, exec } = usePglite()

  /**
   * Analyze a newly created table and suggest potential relations
   * OPTIMIZED: Batch queries to reduce from 300+ queries to ~10 queries
   * Returns the number of suggestions created
   */
  async function analyzeTableForRelations(
    tableId: string,
    entityId: string
  ): Promise<number> {
    console.time('[Analyzer] Total time')
    
    // ========== PHASE 1: Batch fetch ALL metadata (3 queries in parallel) ==========
    console.time('[Analyzer] Phase 1: Metadata')
    const [tableData, sourceFields, otherTables] = await Promise.all([
      query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [tableId]),
      query<CaseFieldRecord>(
        `SELECT * FROM case_fields 
         WHERE "tableId" = $1 
         AND "fieldName" NOT IN ('id', 'created_at', 'updated_at')
         AND "businessType" != 'relation'
         ORDER BY "fieldNameAlias"`,
        [tableId]
      ),
      query<CaseTableRecord>(
        `SELECT DISTINCT ON (name, "tableName") *
         FROM case_tables 
         WHERE "entityId" = $1 
         AND id != $2
         AND status = 'A'
         ORDER BY name, "tableName", "createdAt" DESC`,
        [entityId, tableId]
      )
    ])
    console.timeEnd('[Analyzer] Phase 1: Metadata')

    if (tableData.length === 0 || sourceFields.length === 0 || otherTables.length === 0) {
      console.timeEnd('[Analyzer] Total time')
      return 0
    }

    const table = tableData[0]
    const targetTableIds = otherTables.map(t => t.id)

    // ========== PHASE 2: Batch fetch target fields (1 query) ==========
    console.time('[Analyzer] Phase 2: Target fields')
    const allTargetFields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields 
       WHERE "tableId" = ANY($1)
       AND "fieldName" NOT IN ('id', 'created_at', 'updated_at', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt')
       AND "businessType" != 'relation'
       ORDER BY "fieldNameAlias"`,
      [targetTableIds]
    )
    console.timeEnd('[Analyzer] Phase 2: Target fields')

    // Group fields by table
    const fieldsByTable = new Map<string, CaseFieldRecord[]>()
    for (const field of allTargetFields) {
      if (!field.tableId) continue // Skip fields without tableId
      if (!fieldsByTable.has(field.tableId)) {
        fieldsByTable.set(field.tableId, [])
      }
      fieldsByTable.get(field.tableId)!.push(field)
    }

    // ========== PHASE 3: Batch fetch existing relations/suggestions (2 queries in parallel) ==========
    console.time('[Analyzer] Phase 3: Existing data')
    const [existingRelations, existingSuggestions] = await Promise.all([
      query<CaseFieldRecord>(
        `SELECT "relationTableId" FROM case_fields 
         WHERE "tableId" = $1 
         AND "businessType" = 'relation'`,
        [tableId]
      ),
      query<RelationSuggestionRecord>(
        `SELECT "sourceTableId", "targetTableId" 
         FROM relation_suggestions 
         WHERE "sourceTableId" = $1 
         AND status != 'dismissed'`,
        [tableId]
      )
    ])
    console.timeEnd('[Analyzer] Phase 3: Existing data')

    const linkedTables = new Set(existingRelations.map(r => r.relationTableId))
    const existingPairs = new Set(existingSuggestions.map(s => `${s.sourceTableId}:${s.targetTableId}`))

    // ========== PHASE 4: Fetch source values (batch queries) ==========
    console.time('[Analyzer] Phase 4: Fetch source values')
    const sourceValuePromises = sourceFields.map(async (field) => {
      try {
        const values = await query<{ value: any }>(
          `SELECT "${field.fieldName}" as value 
           FROM "${table.tableName}" 
           WHERE "${field.fieldName}" IS NOT NULL 
           LIMIT $1`,
          [ANALYSIS_ROW_LIMIT]
        )
        return {
          fieldId: field.id,
          type: 'source' as const,
          values: values.map(r => String(r.value).trim())
        }
      } catch (error) {
        console.error(`Error fetching source values for field ${field.fieldName}:`, error)
        return { fieldId: field.id, type: 'source' as const, values: [] }
      }
    })
    
    const sourceValueResults = await Promise.all(sourceValuePromises)
    console.timeEnd('[Analyzer] Phase 4: Fetch source values')

    // ========== PHASE 5: Fetch target values (batch queries) ==========
    console.time('[Analyzer] Phase 5: Fetch target values')
    const targetValuePromises: Promise<{ fieldId: string; type: 'target'; values: string[] }>[] = []
    
    for (const targetTable of otherTables) {
      const targetFields = fieldsByTable.get(targetTable.id) || []
      for (const field of targetFields) {
        targetValuePromises.push(
          (async () => {
            try {
              const values = await query<{ value: any }>(
                `SELECT DISTINCT "${field.fieldName}" as value 
                 FROM "${targetTable.tableName}" 
                 WHERE "${field.fieldName}" IS NOT NULL 
                 LIMIT 1000`
              )
              return {
                fieldId: field.id,
                type: 'target' as const,
                values: values.map(r => String(r.value).trim())
              }
            } catch (error) {
              console.error(`Error fetching target values for field ${field.fieldName}:`, error)
              return { fieldId: field.id, type: 'target' as const, values: [] }
            }
          })()
        )
      }
    }
    
    const targetValueResults = await Promise.all(targetValuePromises)
    console.timeEnd('[Analyzer] Phase 5: Fetch target values')

    // ========== PHASE 6: Group values by field ==========
    console.time('[Analyzer] Phase 6: Process values')
    const valuesByField = new Map<string, Set<string>>()
    
    for (const result of [...sourceValueResults, ...targetValueResults]) {
      const key = `${result.fieldId}:${result.type}`
      valuesByField.set(key, new Set(result.values))
    }
    console.timeEnd('[Analyzer] Phase 6: Process values')

    // ========== PHASE 7: Calculate matches in memory ==========
    console.time('[Analyzer] Phase 7: Calculate matches')
    const suggestions: Array<{
      sourceTableId: string
      sourceFieldId: string
      targetTableId: string
      targetFieldId: string
      matchReason: string
      matchCount: number
      totalCount: number
      sampleValues: string[]
      suggestedType: string
    }> = []

    for (const sourceField of sourceFields) {
      const sourceKey = `${sourceField.id}:source`
      const sourceValues = valuesByField.get(sourceKey)
      
      if (!sourceValues || sourceValues.size === 0) continue

      for (const targetTable of otherTables) {
        // Skip if already linked
        if (linkedTables.has(targetTable.id)) continue
        
        // Skip if suggestion exists
        if (existingPairs.has(`${tableId}:${targetTable.id}`)) continue

        const targetFields = fieldsByTable.get(targetTable.id) || []

        for (const targetField of targetFields) {
          const targetKey = `${targetField.id}:target`
          const targetValues = valuesByField.get(targetKey)
          
          if (!targetValues || targetValues.size === 0) continue

          // Calculate match
          const matches = [...sourceValues].filter(v => targetValues.has(v))
          const matchRate = matches.length / sourceValues.size

          if (matchRate >= MIN_MATCH_THRESHOLD && matches.length > 0) {
            // Determine match reason
            const nameMatch = 
              sourceField.fieldName.toLowerCase().includes(targetField.fieldName.toLowerCase()) ||
              targetField.fieldName.toLowerCase().includes(sourceField.fieldName.toLowerCase()) ||
              sourceField.fieldNameAlias.toLowerCase().includes(targetField.fieldNameAlias.toLowerCase())

            suggestions.push({
              sourceTableId: tableId,
              sourceFieldId: sourceField.id,
              targetTableId: targetTable.id,
              targetFieldId: targetField.id,
              matchReason: nameMatch ? 'name_and_value' : 'value_only',
              matchCount: matches.length,
              totalCount: sourceValues.size,
              sampleValues: matches.slice(0, 3),
              suggestedType: 'multiple'
            })

            // Only one suggestion per table pair
            break
          }
        }
      }
    }
    console.timeEnd('[Analyzer] Phase 7: Calculate matches')

    // ========== PHASE 8: Batch insert all suggestions (1 query) ==========
    if (suggestions.length > 0) {
      console.time('[Analyzer] Phase 7: Insert suggestions')
      const currentUserId = getCurrentUserId()
      const values = suggestions.map((_, i) => 
        `($${i*11+1}, $${i*11+2}, $${i*11+3}, $${i*11+4}, $${i*11+5}, $${i*11+6}, $${i*11+7}, $${i*11+8}, $${i*11+9}, $${i*11+10}, $${i*11+11})`
      ).join(', ')

      const params = suggestions.flatMap(s => [
        s.sourceTableId,
        s.sourceFieldId,
        s.targetTableId,
        s.targetFieldId,
        s.matchReason,
        s.matchCount,
        s.totalCount,
        s.sampleValues,
        s.suggestedType,
        currentUserId,
        currentUserId
      ])

      await query(
        `INSERT INTO relation_suggestions (
          "sourceTableId", "sourceFieldId", "targetTableId", "targetFieldId",
          "matchReason", "matchCount", "totalCount", "sampleValues", "suggestedType",
          "createdBy", "updatedBy"
        ) VALUES ${values}`,
        params
      )
      console.timeEnd('[Analyzer] Phase 8: Insert suggestions')
    }

    console.timeEnd('[Analyzer] Total time')
    console.log(`[Analyzer] Created ${suggestions.length} suggestions`)
    return suggestions.length
  }

  /**
   * Get pending suggestions for a specific table
   */
  async function getPendingSuggestions(tableId: string): Promise<SuggestionWithDetails[]> {
    const suggestions = await query<any>(
      `SELECT 
        s.*,
        st.name as "sourceTableName",
        sf."fieldNameAlias" as "sourceFieldName",
        tt.name as "targetTableName",
        tf."fieldNameAlias" as "targetFieldName"
       FROM relation_suggestions s
       JOIN case_tables st ON s."sourceTableId" = st.id
       JOIN case_fields sf ON s."sourceFieldId" = sf.id
       JOIN case_tables tt ON s."targetTableId" = tt.id
       JOIN case_fields tf ON s."targetFieldId" = tf.id
       WHERE s."sourceTableId" = $1 
       AND s.status = 'pending'
       ORDER BY s."matchCount" DESC, s."createdAt" DESC`,
      [tableId]
    )

    return suggestions
  }

  /**
   * Get suggestions for a specific field (when user opens create relation dialog)
   */
  async function getSuggestionsForField(
    tableId: string,
    fieldId: string
  ): Promise<SuggestionWithDetails[]> {
    const suggestions = await query<any>(
      `SELECT 
        s.*,
        st.name as "sourceTableName",
        sf."fieldNameAlias" as "sourceFieldName",
        tt.name as "targetTableName",
        tf."fieldNameAlias" as "targetFieldName"
       FROM relation_suggestions s
       JOIN case_tables st ON s."sourceTableId" = st.id
       JOIN case_fields sf ON s."sourceFieldId" = sf.id
       JOIN case_tables tt ON s."targetTableId" = tt.id
       JOIN case_fields tf ON s."targetFieldId" = tf.id
       WHERE s."sourceTableId" = $1 
       AND s."sourceFieldId" = $2
       AND s.status = 'pending'
       ORDER BY s."matchCount" DESC`,
      [tableId, fieldId]
    )

    return suggestions
  }

  /**
   * Accept a suggestion and mark it as accepted
   */
  async function acceptSuggestion(suggestionId: string): Promise<void> {
    await query(
      `UPDATE relation_suggestions 
       SET status = 'accepted', "updatedAt" = $1 
       WHERE id = $2`,
      [new Date(), suggestionId]
    )
  }

  /**
   * Dismiss a suggestion
   */
  async function dismissSuggestion(suggestionId: string): Promise<void> {
    await query(
      `UPDATE relation_suggestions 
       SET status = 'dismissed', "updatedAt" = $1 
       WHERE id = $2`,
      [new Date(), suggestionId]
    )
  }

  /**
   * Dismiss all suggestions for a table
   */
  async function dismissAllSuggestions(tableId: string): Promise<void> {
    await query(
      `UPDATE relation_suggestions 
       SET status = 'dismissed', "updatedAt" = $1 
       WHERE "sourceTableId" = $2 AND status = 'pending'`,
      [new Date(), tableId]
    )
  }

  /**
   * Dismiss all suggestions for a specific target table
   * Used when a relation to that table is created (either from suggestion or manually)
   */
  async function dismissSuggestionsByTargetTable(sourceTableId: string, targetTableId: string): Promise<void> {
    await query(
      `UPDATE relation_suggestions 
       SET status = 'dismissed', "updatedAt" = $1 
       WHERE "sourceTableId" = $2 AND "targetTableId" = $3 AND status = 'pending'`,
      [new Date(), sourceTableId, targetTableId]
    )
  }

  return {
    analyzeTableForRelations,
    getPendingSuggestions,
    getSuggestionsForField,
    acceptSuggestion,
    dismissSuggestion,
    dismissAllSuggestions,
    dismissSuggestionsByTargetTable,
    ANALYSIS_ROW_LIMIT // Export for display purposes
  }
}

