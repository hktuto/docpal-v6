import { v7 as uuidv7 } from 'uuid'
import type { 
  CaseTableRecord, 
  CaseFieldRecord,
  FieldDisplayStructure 
} from '../utils/db/schema/newTableSchema'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { getCurrentUserId } from './useCurrentUser'

/**
 * A detected potential relationship between two tables
 */
export interface RelationSuggestion {
  id: string
  
  // Source (the table with the foreign key column)
  sourceTable: {
    id: string
    name: string
    tableName: string  // Physical table name
  }
  sourceField: {
    id: string
    fieldName: string
    fieldNameAlias: string
  }
  
  // Target (the table being referenced)
  targetTable: {
    id: string
    name: string
    tableName: string
  }
  targetField: {
    id: string
    fieldName: string  // Usually 'id'
    fieldNameAlias: string
  }
  
  // Detection info
  confidence: 'high' | 'medium' | 'low'
  matchReason: string
  matchPercentage: number  // 0-100, percentage of values that match
  
  // Sample data for preview
  sampleMatches: Array<{
    sourceValue: string
    targetValue: string
  }>
}

/**
 * Result of analyzing relationships in a workspace
 */
export interface AnalysisResult {
  suggestions: RelationSuggestion[]
  analyzedTables: number
  analyzedFields: number
  timestamp: Date
}

/**
 * Composable for analyzing and detecting relationships between tables
 */
export function useRelationAnalyzer() {
  const { query } = usePglite()
  
  // Patterns that suggest a column might be a foreign key
  const FK_PATTERNS = [
    /_id$/i,           // user_id, customer_id
    /Id$/,             // userId, customerId
    /_ID$/,            // USER_ID
    /^fk_/i,           // fk_user
  ]
  
  // System columns to skip
  const SYSTEM_COLUMNS = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']
  
  /**
   * Check if a field name matches foreign key patterns
   */
  function matchesFkPattern(fieldName: string): boolean {
    return FK_PATTERNS.some(pattern => pattern.test(fieldName))
  }
  
  /**
   * Extract potential table name from a field name
   * e.g., "customer_id" -> "customer", "userId" -> "user"
   */
  function extractTableName(fieldName: string): string | null {
    // Remove common suffixes
    let name = fieldName
      .replace(/_id$/i, '')
      .replace(/Id$/, '')
      .replace(/_ID$/, '')
      .replace(/^fk_/i, '')
    
    if (name && name !== fieldName) {
      return name.toLowerCase()
    }
    return null
  }
  
  /**
   * Get all tables in a workspace
   */
  async function getWorkspaceTables(entityId: string): Promise<CaseTableRecord[]> {
    const tables = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE "entityId" = $1 AND status = 'A'`,
      [entityId]
    )
    return tables
  }
  
  /**
   * Get all fields for a table
   */
  async function getTableFields(tableId: string): Promise<CaseFieldRecord[]> {
    const fields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1`,
      [tableId]
    )
    return fields
  }
  
  /**
   * Get sample values from a column
   */
  async function getSampleValues(
    tableName: string, 
    fieldName: string, 
    limit: number = 100
  ): Promise<string[]> {
    try {
      const rows = await query<Record<string, any>>(
        `SELECT DISTINCT "${fieldName}" FROM "${tableName}" 
         WHERE "${fieldName}" IS NOT NULL 
         LIMIT ${limit}`
      )
      return rows.map(r => String(r[fieldName]))
    } catch (error) {
      console.error(`Error getting sample values from ${tableName}.${fieldName}:`, error)
      return []
    }
  }
  
  /**
   * Get ID values from a table
   */
  async function getTableIds(tableName: string, limit: number = 1000): Promise<Set<string>> {
    try {
      const rows = await query<{ id: string }>(
        `SELECT id FROM "${tableName}" LIMIT ${limit}`
      )
      return new Set(rows.map(r => r.id))
    } catch (error) {
      console.error(`Error getting IDs from ${tableName}:`, error)
      return new Set()
    }
  }
  
  /**
   * Calculate match percentage between source values and target IDs
   */
  function calculateMatchPercentage(
    sourceValues: string[], 
    targetIds: Set<string>
  ): { percentage: number; matches: string[] } {
    if (sourceValues.length === 0) {
      return { percentage: 0, matches: [] }
    }
    
    const matches = sourceValues.filter(v => targetIds.has(v))
    const percentage = Math.round((matches.length / sourceValues.length) * 100)
    
    return { percentage, matches }
  }
  
  /**
   * Determine confidence level based on match data
   */
  function determineConfidence(
    nameMatch: boolean, 
    matchPercentage: number
  ): 'high' | 'medium' | 'low' {
    if (nameMatch && matchPercentage >= 80) return 'high'
    if (nameMatch && matchPercentage >= 50) return 'medium'
    if (matchPercentage >= 90) return 'high'
    if (matchPercentage >= 70) return 'medium'
    return 'low'
  }
  
  /**
   * Analyze all tables in a workspace for potential relationships
   */
  async function analyzeWorkspace(entityId: string): Promise<AnalysisResult> {
    const suggestions: RelationSuggestion[] = []
    let analyzedFields = 0
    
    // Get all tables in the workspace
    const tables = await getWorkspaceTables(entityId)
    
    if (tables.length < 2) {
      // Need at least 2 tables for relationships
      return {
        suggestions: [],
        analyzedTables: tables.length,
        analyzedFields: 0,
        timestamp: new Date()
      }
    }
    
    // Build a lookup map: table name variations -> table info
    const tableNameMap = new Map<string, CaseTableRecord>()
    const tableIdFields = new Map<string, Set<string>>()  // tableId -> set of IDs
    const tableFields = new Map<string, CaseFieldRecord[]>()  // tableId -> fields
    
    // Build field name to table mapping for same-name detection
    // fieldName -> [{ table, field }]
    const fieldNameToTables = new Map<string, Array<{ table: CaseTableRecord; field: CaseFieldRecord }>>()
    
    for (const table of tables) {
      // Add various name variations for matching
      const name = table.name.toLowerCase()
      tableNameMap.set(name, table)
      tableNameMap.set(name + 's', table)  // Plural
      tableNameMap.set(name.replace(/s$/, ''), table)  // Singular
      
      // Pre-fetch IDs for each table
      const ids = await getTableIds(table.tableName)
      tableIdFields.set(table.id, ids)
      
      // Pre-fetch fields and build field name index
      const fields = await getTableFields(table.id)
      tableFields.set(table.id, fields)
      
      for (const field of fields) {
        if (SYSTEM_COLUMNS.includes(field.fieldName)) continue
        
        // Index by both fieldName and fieldNameAlias (normalized)
        const normalizedName = field.fieldNameAlias.toLowerCase().replace(/[\s_-]+/g, '')
        
        if (!fieldNameToTables.has(normalizedName)) {
          fieldNameToTables.set(normalizedName, [])
        }
        fieldNameToTables.get(normalizedName)!.push({ table, field })
      }
    }
    
    // Analyze each table's fields
    for (const sourceTable of tables) {
      const fields = tableFields.get(sourceTable.id) || []
      
      for (const field of fields) {
        analyzedFields++
        
        // Skip system columns and already-relation fields
        if (SYSTEM_COLUMNS.includes(field.fieldName)) continue
        if (field.businessType === 'relation') continue
        
        // Check if field name matches FK pattern
        const matchesPattern = matchesFkPattern(field.fieldName) || 
                               matchesFkPattern(field.fieldNameAlias)
        
        // Extract potential table name from field
        const potentialTableName = extractTableName(field.fieldName) || 
                                   extractTableName(field.fieldNameAlias)
        
        // Find matching target table
        let targetTable: CaseTableRecord | undefined
        let targetField: CaseFieldRecord | undefined
        let nameMatch = false
        let sameNameMatch = false
        
        // Method 1: FK pattern matching (customer_id -> customers table)
        if (potentialTableName) {
          targetTable = tableNameMap.get(potentialTableName)
          nameMatch = !!targetTable
        }
        
        // Method 2: Same column name in different table (company_name -> company.company_name)
        if (!targetTable) {
          const normalizedName = field.fieldNameAlias.toLowerCase().replace(/[\s_-]+/g, '')
          const sameNameFields = fieldNameToTables.get(normalizedName) || []
          
          // Find a matching field in a different table
          for (const { table: candidateTable, field: candidateField } of sameNameFields) {
            if (candidateTable.id === sourceTable.id) continue
            
            // Get sample values from both columns
            const sourceValues = await getSampleValues(sourceTable.tableName, field.fieldName, 50)
            const targetValues = await getSampleValues(candidateTable.tableName, candidateField.fieldName, 100)
            const targetValueSet = new Set(targetValues)
            
            if (sourceValues.length > 0 && targetValues.length > 0) {
              const { percentage } = calculateMatchPercentage(sourceValues, targetValueSet)
              
              // If good match, this could be a lookup relationship
              if (percentage >= 50) {
                targetTable = candidateTable
                targetField = candidateField
                sameNameMatch = true
                break
              }
            }
          }
        }
        
        // Method 3: Value matching against IDs (fallback for FK patterns)
        if (!targetTable && matchesPattern) {
          const sourceValues = await getSampleValues(
            sourceTable.tableName, 
            field.fieldName, 
            50
          )
          
          if (sourceValues.length > 0) {
            // Check against each other table's IDs
            for (const candidateTable of tables) {
              if (candidateTable.id === sourceTable.id) continue
              
              const targetIds = tableIdFields.get(candidateTable.id)
              if (!targetIds || targetIds.size === 0) continue
              
              const { percentage } = calculateMatchPercentage(sourceValues, targetIds)
              
              if (percentage >= 50) {
                targetTable = candidateTable
                break
              }
            }
          }
        }
        
        // If we found a potential target, validate with value matching
        if (targetTable && targetTable.id !== sourceTable.id) {
          let matchPercentage = 0
          let matchedValues: string[] = []
          
          if (sameNameMatch && targetField) {
            // For same-name matches, compare values between the two columns
            const sourceValues = await getSampleValues(sourceTable.tableName, field.fieldName, 100)
            const targetValues = await getSampleValues(targetTable.tableName, targetField.fieldName, 100)
            const targetValueSet = new Set(targetValues)
            const result = calculateMatchPercentage(sourceValues, targetValueSet)
            matchPercentage = result.percentage
            matchedValues = result.matches
          } else {
            // For ID-based matches, compare against target table's IDs
            const sourceValues = await getSampleValues(sourceTable.tableName, field.fieldName, 100)
            const targetIds = tableIdFields.get(targetTable.id) || new Set()
            const result = calculateMatchPercentage(sourceValues, targetIds)
            matchPercentage = result.percentage
            matchedValues = result.matches
          }
          
          // Only suggest if there's meaningful overlap
          if (matchPercentage >= 30 || (nameMatch && matchPercentage >= 10) || (sameNameMatch && matchPercentage >= 40)) {
            // Determine the target field (either the same-name field or the ID field)
            const targetTableFields = tableFields.get(targetTable.id) || []
            const finalTargetField = targetField || targetTableFields.find(f => f.fieldName === 'id') || {
              id: 'id',
              fieldName: 'id',
              fieldNameAlias: 'ID'
            }
            
            const confidence = determineConfidence(nameMatch || sameNameMatch, matchPercentage)
            
            // Build match reason
            let matchReason = ''
            if (sameNameMatch) {
              matchReason = `Same column name "${field.fieldNameAlias}" found in "${targetTable.name}"`
            } else if (nameMatch) {
              matchReason = `Column name "${field.fieldNameAlias}" matches table "${targetTable.name}"`
            } else {
              matchReason = `${matchPercentage}% of values match IDs in "${targetTable.name}"`
            }
            if (matchPercentage > 0) {
              matchReason += ` (${matchPercentage}% match rate)`
            }
            
            // Get sample matches for preview
            const sampleMatches = matchedValues.slice(0, 5).map(v => ({
              sourceValue: v,
              targetValue: v
            }))
            
            suggestions.push({
              id: uuidv7(),
              sourceTable: {
                id: sourceTable.id,
                name: sourceTable.name,
                tableName: sourceTable.tableName
              },
              sourceField: {
                id: field.id,
                fieldName: field.fieldName,
                fieldNameAlias: field.fieldNameAlias
              },
              targetTable: {
                id: targetTable.id,
                name: targetTable.name,
                tableName: targetTable.tableName
              },
              targetField: {
                id: finalTargetField.id || 'id',
                fieldName: finalTargetField.fieldName || 'id',
                fieldNameAlias: finalTargetField.fieldNameAlias || 'ID'
              },
              confidence,
              matchReason,
              matchPercentage,
              sampleMatches
            })
          }
        }
      }
    }
    
    // Sort by confidence (high first) then by match percentage
    suggestions.sort((a, b) => {
      const confidenceOrder = { high: 0, medium: 1, low: 2 }
      const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
      if (confDiff !== 0) return confDiff
      return b.matchPercentage - a.matchPercentage
    })
    
    return {
      suggestions,
      analyzedTables: tables.length,
      analyzedFields,
      timestamp: new Date()
    }
  }
  
  /**
   * Create a new relation field from a suggestion
   * Keeps the original field intact
   */
  async function createRelationField(
    suggestion: RelationSuggestion,
    createdBy?: string
  ): Promise<CaseFieldRecord> {
    const now = new Date()
    const fieldId = uuidv7()
    
    // Generate a unique field name for the relation
    const relationFieldName = `rel_${suggestion.sourceField.fieldName}`
    const relationFieldAlias = `${suggestion.sourceField.fieldNameAlias} (Relation)`
    
    const displayStructure: FieldDisplayStructure = {
      type: ColumnFieldType.Relation,
      properties: {
        relationTableId: suggestion.targetTable.id,
        displayField: suggestion.targetField.fieldName
      }
    }
    
    const newField: Partial<CaseFieldRecord> = {
      id: fieldId,
      tableId: suggestion.sourceTable.id,
      fieldName: relationFieldName,
      fieldNameAlias: relationFieldAlias,
      businessType: 'relation',
      fieldType: 'uuid',
      displayStructure,
      isRequired: false,
      isHidden: false,
      isArray: false,
      isUnique: false,
      isReference: true,
      relationTableId: suggestion.targetTable.id,
      relationFieldId: suggestion.sourceField.id,
      displayFieldNames: [],  // User can configure display fields later
      createdBy: createdBy || getCurrentUserId(),
      createdAt: now,
      updatedBy: createdBy || getCurrentUserId(),
      updatedAt: now
    }
    
    // Insert the new relation field
    await query(
      `INSERT INTO case_fields (
        id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
        "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
        "isReference", "relationTableId", "relationFieldId", "displayFieldNames",
        "createdBy", "createdAt", "updatedBy", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        newField.id,
        newField.tableId,
        newField.fieldName,
        newField.fieldNameAlias,
        newField.businessType,
        newField.fieldType,
        JSON.stringify(newField.displayStructure),
        newField.isRequired,
        newField.isHidden,
        newField.isArray,
        newField.isUnique,
        newField.isReference,
        newField.relationTableId,
        newField.relationFieldId,
        newField.displayFieldNames,
        newField.createdBy,
        newField.createdAt,
        newField.updatedBy,
        newField.updatedAt
      ]
    )
    
    return newField as CaseFieldRecord
  }
  
  /**
   * Create multiple relation fields from suggestions
   */
  async function createRelationFields(
    suggestions: RelationSuggestion[],
    createdBy?: string
  ): Promise<CaseFieldRecord[]> {
    const createdFields: CaseFieldRecord[] = []
    
    for (const suggestion of suggestions) {
      try {
        const field = await createRelationField(suggestion, createdBy)
        createdFields.push(field)
      } catch (error) {
        console.error(`Error creating relation field for ${suggestion.id}:`, error)
      }
    }
    
    return createdFields
  }
  
  return {
    analyzeWorkspace,
    createRelationField,
    createRelationFields
  }
}
