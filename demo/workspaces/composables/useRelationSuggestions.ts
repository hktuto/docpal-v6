import type { RelationSuggestionRecord, RelationSuggestionInsert, CaseFieldRecord, CaseTableRecord } from '../utils/db/schema/newTableSchema'

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
   * Returns the number of suggestions created
   */
  async function analyzeTableForRelations(
    tableId: string,
    entityId: string
  ): Promise<number> {
    // Get the table info
    const tableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [tableId]
    )
    if (tableData.length === 0) return 0
    const table = tableData[0]

    // Get all fields from the new table (excluding system fields)
    const sourceFields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields 
       WHERE "tableId" = $1 
       AND "fieldName" NOT IN ('id', 'created_at', 'updated_at')
       AND "businessType" != 'relation'
       ORDER BY "fieldNameAlias"`,
      [tableId]
    )

    if (sourceFields.length === 0) return 0

    // Get all other tables in the same workspace (excluding current table)
    const otherTables = await query<CaseTableRecord>(
      `SELECT DISTINCT ON (name, "tableName") *
       FROM case_tables 
       WHERE "entityId" = $1 
       AND id != $2
       AND status = 'A'
       ORDER BY name, "tableName", "createdAt" DESC`,
      [entityId, tableId]
    )

    if (otherTables.length === 0) return 0

    let suggestionsCount = 0

    // Analyze each source field
    for (const sourceField of sourceFields) {
      // Get sample values from the source field (first N rows)
      const sourceValues = await query<any>(
        `SELECT "${sourceField.fieldName}" as value 
         FROM "${table.tableName}" 
         WHERE "${sourceField.fieldName}" IS NOT NULL 
         LIMIT $1`,
        [ANALYSIS_ROW_LIMIT]
      )

      if (sourceValues.length === 0) continue

      const sourceValueSet = new Set(sourceValues.map(r => String(r.value).trim()))

      // Check against each target table
      for (const targetTable of otherTables) {
        // Get all fields from target table
        const targetFields = await query<CaseFieldRecord>(
          `SELECT * FROM case_fields 
           WHERE "tableId" = $1 
           AND "fieldName" NOT IN ('created_at', 'updated_at')
           AND "businessType" != 'relation'
           ORDER BY "fieldNameAlias"`,
          [targetTable.id]
        )

        for (const targetField of targetFields) {
          // Get values from target field
          const targetValues = await query<any>(
            `SELECT DISTINCT "${targetField.fieldName}" as value 
             FROM "${targetTable.tableName}" 
             WHERE "${targetField.fieldName}" IS NOT NULL 
             LIMIT 1000`
          )

          if (targetValues.length === 0) continue

          const targetValueSet = new Set(targetValues.map(r => String(r.value).trim()))

          // Calculate match
          let matchCount = 0
          const matchingValues: string[] = []
          
          for (const sourceValue of sourceValueSet) {
            if (targetValueSet.has(sourceValue)) {
              matchCount++
              if (matchingValues.length < 3) {
                matchingValues.push(sourceValue)
              }
            }
          }

          const matchRate = matchCount / sourceValues.length
          
          // Only suggest if match rate is above threshold
          if (matchRate >= MIN_MATCH_THRESHOLD && matchCount > 0) {
            // Check if target table is already linked to source table (any relation)
            const existingRelations = await query<CaseFieldRecord>(
              `SELECT * FROM case_fields 
               WHERE "tableId" = $1 
               AND "businessType" = 'relation' 
               AND "relationTableId" = $2`,
              [tableId, targetTable.id]
            )

            // If target table is already linked, skip this suggestion
            // User can just add more displayFieldIds to existing relation
            if (existingRelations.length > 0) {
              continue
            }

            // Check if this specific suggestion already exists
            const existing = await query<RelationSuggestionRecord>(
              `SELECT * FROM relation_suggestions 
               WHERE "sourceTableId" = $1 
               AND "targetTableId" = $2 
               AND status != 'dismissed'`,
              [tableId, targetTable.id]
            )

            if (existing.length === 0) {
              // Determine match reason
              const nameMatch = sourceField.fieldName.toLowerCase().includes(targetField.fieldName.toLowerCase()) ||
                               targetField.fieldName.toLowerCase().includes(sourceField.fieldName.toLowerCase()) ||
                               sourceField.fieldNameAlias.toLowerCase().includes(targetField.fieldNameAlias.toLowerCase())
              
              const matchReason = nameMatch ? 'name_and_value' : 'value_only'
              
              // Always suggest multiple relation
              const suggestedType = 'multiple'

              // Create suggestion
              await query(
                `INSERT INTO relation_suggestions (
                  "sourceTableId", "sourceFieldId", "targetTableId", "targetFieldId",
                  "matchReason", "matchCount", "totalCount", "sampleValues", "suggestedType"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  tableId,
                  sourceField.id,
                  targetTable.id,
                  targetField.id,
                  matchReason,
                  matchCount,
                  sourceValues.length,
                  matchingValues,
                  suggestedType
                ]
              )

              suggestionsCount++
            }
          }
        }
      }
    }

    return suggestionsCount
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

  return {
    analyzeTableForRelations,
    getPendingSuggestions,
    getSuggestionsForField,
    acceptSuggestion,
    dismissSuggestion,
    dismissAllSuggestions,
    ANALYSIS_ROW_LIMIT // Export for display purposes
  }
}

