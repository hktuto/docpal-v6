import { newClientApi, postDynamicActions } from 'api'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import type { TableFieldDTO, MenuDTO } from 'api/src/generate/newClient'
import type { ParsedSheet } from './excelParser'

const MAX_EXISTING_TABLES = 20
const EXISTING_SAMPLE_ROW_COUNT = 50
const CONFIDENCE_THRESHOLD = 0.45
const MAX_GUESSES_PER_SOURCE = 5

export interface ExistingTableSnapshot {
  tableId: string
  tableName: string
  fields: TableFieldDTO[]
  sampleRows: Record<string, any>[]
}

export interface RelationGuess {
  sourceSheetName: string
  sourceFieldName: string
  sourceFieldType: ColumnFieldType
  targetTableId: string
  targetTableName: string
  targetFieldId: string
  targetFieldName: string
  confidence: number
  reasons: RelationGuessReason[]
  dismissed: boolean
}

export interface RelationGuessReason {
  type: 'name_match' | 'value_overlap' | 'type_compatibility' | 'table_name_in_field'
  score: number
  detail: string
}

/**
 * Fetch existing table snapshots (fields + sample rows) from the database menu.
 */
export async function fetchExistingTableSnapshots(
  databaseId: string,
  limit: number = MAX_EXISTING_TABLES
): Promise<ExistingTableSnapshot[]> {
  const res: any = await newClientApi.getDynamicDbMenusTree({
    referenceEntityType: 'case',
    referenceEntityId: databaseId
  })
  const menus: MenuDTO[] = res?.data ?? []

  const tableItems = flattenMenuItems(menus).filter(
    (item) => item.item_type === 'master_table' && item.item_id
  )

  const limitedItems = tableItems.slice(0, limit)

  const snapshots = await Promise.all(
    limitedItems.map(async (item) => {
      try {
        const fieldsRes: any = await newClientApi.getDynamicDbTableTableidFields(item.item_id!)
        const fields: TableFieldDTO[] = fieldsRes?.data ?? []

        let sampleRows: Record<string, any>[] = []
        try {
          const rowsRes: any = await postDynamicActions({
            tableId: item.item_id!,
            columns: [],
            pagination: { pageNum: 1, pageSize: EXISTING_SAMPLE_ROW_COUNT }
          })
          sampleRows = rowsRes?.data?.data ?? []
        } catch {
          // Best-effort: if fetching rows fails, continue with fields only
        }

        return {
          tableId: item.item_id!,
          tableName: item.name || item.item_id!,
          fields,
          sampleRows
        }
      } catch {
        return null
      }
    })
  )

  return snapshots.filter((s): s is ExistingTableSnapshot => s !== null)
}

function flattenMenuItems(items: MenuDTO[]): MenuDTO[] {
  const result: MenuDTO[] = []
  for (const item of items) {
    result.push(item)
    if (item.children && item.children.length > 0) {
      result.push(...flattenMenuItems(item.children))
    }
  }
  return result
}

/**
 * Run the relation guessing algorithm between parsed Excel sheets and existing tables.
 */
export function guessRelations(
  sources: ParsedSheet[],
  targets: ExistingTableSnapshot[]
): RelationGuess[] {
  const guesses: RelationGuess[] = []

  for (const source of sources) {
    const sheetGuesses: RelationGuess[] = []

    for (const target of targets) {
      for (let sIdx = 0; sIdx < source.fieldNames.length; sIdx++) {
        const sourceFieldName = source.fieldNames[sIdx]
        const sourceHeader = source.headers[sIdx]
        const sourceType = source.columnTypes[sIdx]

        for (const targetField of target.fields) {
          const targetFieldName = targetField.field_name || ''
          const targetFieldId = targetField.id || ''
          const targetFieldType = targetField.business_type || ''

          const scoreResult = computeScore(
            source,
            sourceFieldName,
            sourceHeader,
            sourceType,
            target,
            targetFieldName,
            targetFieldType
          )

          if (scoreResult.confidence >= CONFIDENCE_THRESHOLD) {
            sheetGuesses.push({
              sourceSheetName: source.sheetName,
              sourceFieldName,
              sourceFieldType: sourceType,
              targetTableId: target.tableId,
              targetTableName: target.tableName,
              targetFieldId,
              targetFieldName,
              confidence: scoreResult.confidence,
              reasons: scoreResult.reasons,
              dismissed: false
            })
          }
        }
      }
    }

    // Sort by confidence desc and keep top N per source sheet
    sheetGuesses.sort((a, b) => b.confidence - a.confidence)
    guesses.push(...sheetGuesses.slice(0, MAX_GUESSES_PER_SOURCE))
  }

  // Global sort by confidence desc
  guesses.sort((a, b) => b.confidence - a.confidence)
  return guesses
}

function computeScore(
  source: ParsedSheet,
  sourceFieldName: string,
  sourceHeader: string,
  sourceType: ColumnFieldType,
  target: ExistingTableSnapshot,
  targetFieldName: string,
  targetFieldType: string
): { confidence: number; reasons: RelationGuessReason[] } {
  const reasons: RelationGuessReason[] = []
  let score = 0

  const normalizedSourceField = sourceFieldName.toLowerCase()
  const normalizedTargetField = targetFieldName.toLowerCase()
  const normalizedTargetTable = normalizeName(target.tableName)
  const normalizedSourceHeader = sourceHeader.toLowerCase()

  // ---- Name-match heuristics ----

  // Exact field name match
  if (normalizedSourceField === normalizedTargetField) {
    score += 0.25
    reasons.push({
      type: 'name_match',
      score: 0.25,
      detail: `Field name "${sourceFieldName}" exactly matches "${targetFieldName}"`
    })
  }

  // ID suffix / prefix with table name match
  const idSuffixes = ['_id', '_no', '_code', '_ref']
  const hasIdSuffix = idSuffixes.some((suf) => normalizedSourceField.endsWith(suf))
  if (hasIdSuffix) {
    const prefix = normalizedSourceField.replace(/(_id|_no|_code|_ref)$/, '')
    if (
      prefix === normalizedTargetField ||
      prefix === normalizedTargetTable ||
      levenshteinSimilarity(prefix, normalizedTargetTable) > 0.8
    ) {
      score += 0.35
      reasons.push({
        type: 'name_match',
        score: 0.35,
        detail: `Field "${sourceFieldName}" has ID suffix and prefix "${prefix}" matches target table "${target.tableName}"`
      })
    }
  }

  // Table name inside field name
  if (
    normalizedSourceField.includes(normalizedTargetTable) ||
    normalizedSourceHeader.includes(normalizedTargetTable)
  ) {
    score += 0.15
    reasons.push({
      type: 'table_name_in_field',
      score: 0.15,
      detail: `Target table name "${target.tableName}" appears in source field "${sourceFieldName}"`
    })
  }

  // Levenshtein similarity between field names
  const fieldSim = levenshteinSimilarity(normalizedSourceField, normalizedTargetField)
  if (fieldSim > 0.8) {
    score += 0.15
    reasons.push({
      type: 'name_match',
      score: 0.15,
      detail: `Field names are ${Math.round(fieldSim * 100)}% similar`
    })
  }

  // ---- Value overlap ----
  const overlapScore = computeValueOverlap(source, sourceFieldName, target, targetFieldName)
  if (overlapScore > 0) {
    score += overlapScore
    const detail =
      overlapScore >= 0.4
        ? `High value overlap between "${sourceFieldName}" and "${targetFieldName}"`
        : `Moderate value overlap between "${sourceFieldName}" and "${targetFieldName}"`
    reasons.push({ type: 'value_overlap', score: overlapScore, detail })
  }

  // ---- Type compatibility ----
  const sourceTypeStr = String(sourceType).toLowerCase()
  const targetTypeStr = targetFieldType.toLowerCase()
  const compatible = areTypesCompatible(sourceTypeStr, targetTypeStr)
  if (compatible) {
    score += 0.05
    reasons.push({
      type: 'type_compatibility',
      score: 0.05,
      detail: `Types ${sourceType} and ${targetFieldType} are compatible`
    })
  } else if (sourceTypeStr !== 'text' && targetTypeStr !== 'text') {
    score -= 0.1
    reasons.push({
      type: 'type_compatibility',
      score: -0.1,
      detail: `Types ${sourceType} and ${targetFieldType} are incompatible`
    })
  }

  const confidence = Math.max(0, Math.min(1, score))
  return { confidence, reasons }
}

function computeValueOverlap(
  source: ParsedSheet,
  sourceFieldName: string,
  target: ExistingTableSnapshot,
  targetFieldName: string
): number {
  const sourceValues = source.sampleRows
    .map((r) => String(r[sourceFieldName] ?? ''))
    .filter((v) => v !== '')

  if (sourceValues.length === 0) return 0

  const targetValues = new Set(
    target.sampleRows
      .map((r) => {
        const val = r[targetFieldName]
        return val !== undefined && val !== null ? String(val) : ''
      })
      .filter((v) => v !== '')
  )

  if (targetValues.size === 0) return 0

  let matched = 0
  for (const val of sourceValues) {
    if (targetValues.has(val)) matched++
  }

  const ratio = matched / sourceValues.length
  if (ratio > 0.7) return 0.4
  if (ratio > 0.5) return 0.25
  if (ratio > 0.3) return 0.1
  return 0
}

function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === targetType) return true
  const numericTypes = ['number', 'rating']
  if (numericTypes.includes(sourceType) && numericTypes.includes(targetType)) return true
  const textTypes = ['text', 'singleselect', 'multiselect']
  if (textTypes.includes(sourceType) && textTypes.includes(targetType)) return true
  return false
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\/\\?%*:|"<>\s\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const distance = matrix[b.length][a.length]
  const maxLen = Math.max(a.length, b.length)
  return 1 - distance / maxLen
}
