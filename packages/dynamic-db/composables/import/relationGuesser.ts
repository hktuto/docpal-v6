import { newClientApi, postDynamicActions } from 'api'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import type { TableFieldDTO, MenuDTO } from 'api/src/generate/newClient'

const EXISTING_SAMPLE_ROW_COUNT = 50
const CONFIDENCE_THRESHOLD = 0.45
const MAX_GUESSES_PER_SOURCE = 5

/**
 * Build a map of table IDs to table names from the database menu.
 */
export async function captureTableNameMap(databaseId: string): Promise<Map<string, string>> {
  try {
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: databaseId
    })
    const menus: MenuDTO[] = res?.data ?? []
    const map = new Map<string, string>()
    for (const item of flattenMenuItems(menus)) {
      if (item.item_type === 'master_table' && item.item_id) {
        map.set(item.item_id, item.name || item.item_id)
      }
    }
    return map
  } catch {
    return new Map()
  }
}

export interface TableSnapshot {
  tableId: string
  tableName: string
  fields: TableFieldDTO[]
  sampleRows: Record<string, any>[]
}

export interface RelationGuess {
  /** The newly imported table that would contain the foreign-key column */
  sourceTableId: string
  sourceTableName: string
  sourceFieldId: string
  sourceFieldName: string
  sourceFieldAlias: string
  sourceFieldType: ColumnFieldType
  /** The table being referenced (existing or also newly imported) */
  targetTableId: string
  targetTableName: string
  targetFieldId: string
  targetFieldName: string
  targetFieldAlias: string
  targetFieldType: ColumnFieldType
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
 * Capture the current set of master_table IDs from the database menu.
 */
export async function captureTableSnapshot(databaseId: string): Promise<Set<string>> {
  try {
    const res: any = await newClientApi.getDynamicDbMenusTree({
      referenceEntityType: 'case',
      referenceEntityId: databaseId
    })
    const menus: MenuDTO[] = res?.data ?? []
    const ids = flattenMenuItems(menus)
      .filter((item) => item.item_type === 'master_table' && item.item_id)
      .map((item) => item.item_id!)
    return new Set(ids)
  } catch {
    return new Set()
  }
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
 * Resolve newly created table IDs by diffing a pre-import snapshot against the current menu.
 */
export async function resolveNewTables(
  preSnapshot: Set<string>,
  databaseId: string
): Promise<string[]> {
  const postSnapshot = await captureTableSnapshot(databaseId)
  const newIds: string[] = []
  for (const id of postSnapshot) {
    if (!preSnapshot.has(id)) {
      newIds.push(id)
    }
  }
  return newIds
}

/**
 * Fetch a single table snapshot (fields + sample rows).
 */
export async function fetchTableSnapshot(
  tableId: string,
  nameMap?: Map<string, string>
): Promise<TableSnapshot | null> {
  try {
    const fieldsRes: any = await newClientApi.getDynamicDbTableTableidFields(tableId)
    const fields: TableFieldDTO[] = fieldsRes?.data ?? []

    let sampleRows: Record<string, any>[] = []
    try {
      const rowsRes: any = await postDynamicActions({
        tableId,
        columns: [{ name: '*' }],
        pagination: { pageNum: 0, pageSize: EXISTING_SAMPLE_ROW_COUNT }
      })
      sampleRows = rowsRes?.data?.data ?? []
    } catch {
      // Best-effort: continue with fields only
    }

    const tableName = nameMap?.get(tableId) || tableId

    return { tableId, tableName, fields, sampleRows }
  } catch {
    return null
  }
}

/**
 * Run the relation guessing algorithm.
 *
 * @param sources — newly imported tables
 * @param targets — all tables to compare against (existing + other new tables)
 */
export function guessRelations(sources: TableSnapshot[], targets: TableSnapshot[]): RelationGuess[] {
  const guesses: RelationGuess[] = []

  for (const source of sources) {
    const sheetGuesses: RelationGuess[] = []

    for (const target of targets) {
      // Do not compare a table to itself
      if (source.tableId === target.tableId) continue

      for (const sourceField of source.fields) {
        const sourceFieldId = sourceField.id || ''
        const sourceFieldName = sourceField.field_name || ''
        const sourceFieldAlias = sourceField.field_name_alias || sourceFieldName
        const sourceFieldType = sourceField.business_type || ''

        for (const targetField of target.fields) {
          const targetFieldName = targetField.field_name || ''
          const targetFieldAlias = targetField.field_name_alias || targetFieldName
          const targetFieldId = targetField.id || ''
          const targetFieldType = targetField.business_type || ''

          const scoreResult = computeScore(
            source.tableName,
            sourceFieldName,
            sourceFieldAlias,
            sourceFieldType,
            source.sampleRows,
            target.tableName,
            targetFieldName,
            targetFieldAlias,
            targetFieldType,
            target.sampleRows
          )

          if (scoreResult.confidence >= CONFIDENCE_THRESHOLD) {
            sheetGuesses.push({
              sourceTableId: source.tableId,
              sourceTableName: source.tableName,
              sourceFieldId,
              sourceFieldName,
              sourceFieldAlias,
              sourceFieldType: sourceFieldType as ColumnFieldType,
              targetTableId: target.tableId,
              targetTableName: target.tableName,
              targetFieldId,
              targetFieldName,
              targetFieldAlias,
              targetFieldType: targetFieldType as ColumnFieldType,
              confidence: scoreResult.confidence,
              reasons: scoreResult.reasons,
              dismissed: false
            })
          }
        }
      }
    }

    sheetGuesses.sort((a, b) => b.confidence - a.confidence)
    guesses.push(...sheetGuesses.slice(0, MAX_GUESSES_PER_SOURCE))
  }

  // Generate inverse guesses so that every detected relation is bidirectional.
  // If A.field → B.field is a strong match, B.field → A.field should also be suggested.
  const forwardKeys = new Set(guesses.map((g) => guessKey(g)))
  const inverses: RelationGuess[] = []

  for (const g of guesses) {
    const inverseKey = `${g.targetTableId}:${g.targetFieldName}→${g.sourceTableId}:${g.sourceFieldName}`
    if (forwardKeys.has(inverseKey)) continue // Inverse already exists naturally

    inverses.push({
      sourceTableId: g.targetTableId,
      sourceTableName: g.targetTableName,
      sourceFieldId: g.targetFieldId,
      sourceFieldName: g.targetFieldName,
      sourceFieldAlias: g.targetFieldAlias,
      sourceFieldType: g.targetFieldType,
      targetTableId: g.sourceTableId,
      targetTableName: g.sourceTableName,
      targetFieldId: g.sourceFieldId,
      targetFieldName: g.sourceFieldName,
      targetFieldAlias: g.sourceFieldAlias,
      confidence: g.confidence,
      reasons: [
        ...g.reasons,
        {
          type: 'name_match',
          score: 0,
          detail: `Inverse of ${g.sourceTableName}.${g.sourceFieldAlias} → ${g.targetTableName}.${g.targetFieldAlias}`
        }
      ],
      dismissed: false
    })
  }

  guesses.push(...inverses)
  guesses.sort((a, b) => b.confidence - a.confidence)
  return guesses
}

function guessKey(g: RelationGuess): string {
  return `${g.sourceTableId}:${g.sourceFieldName}→${g.targetTableId}:${g.targetFieldName}`
}

function computeScore(
  sourceTableName: string,
  sourceFieldName: string,
  sourceFieldAlias: string,
  sourceFieldType: string,
  sourceRows: Record<string, any>[],
  targetTableName: string,
  targetFieldName: string,
  targetFieldAlias: string,
  targetFieldType: string,
  targetRows: Record<string, any>[]
): { confidence: number; reasons: RelationGuessReason[] } {
  const reasons: RelationGuessReason[] = []
  let score = 0

  // Use aliases for name-match heuristics (import may generate opaque field_name values like f_3083_xxx)
  const normalizedSourceAlias = normalizeName(sourceFieldAlias)
  const normalizedTargetAlias = normalizeName(targetFieldAlias)
  const normalizedTargetTable = normalizeName(targetTableName)

  // ---- Name-match heuristics ----

  if (normalizedSourceAlias === normalizedTargetAlias) {
    score += 0.25
    reasons.push({
      type: 'name_match',
      score: 0.25,
      detail: `Field alias "${sourceFieldAlias}" exactly matches "${targetFieldAlias}"`
    })
  }

  const idSuffixes = ['_id', '_no', '_code', '_ref']
  const hasIdSuffix = idSuffixes.some((suf) => normalizedSourceAlias.endsWith(suf))
  if (hasIdSuffix) {
    const prefix = normalizedSourceAlias.replace(/(_id|_no|_code|_ref)$/, '')
    if (
      prefix === normalizedTargetAlias ||
      prefix === normalizedTargetTable ||
      levenshteinSimilarity(prefix, normalizedTargetTable) > 0.8
    ) {
      score += 0.35
      reasons.push({
        type: 'name_match',
        score: 0.35,
        detail: `Field "${sourceFieldAlias}" has ID suffix and prefix "${prefix}" matches target table "${targetTableName}"`
      })
    }
  }

  if (normalizedSourceAlias.includes(normalizedTargetTable)) {
    score += 0.15
    reasons.push({
      type: 'table_name_in_field',
      score: 0.15,
      detail: `Target table name "${targetTableName}" appears in source field alias "${sourceFieldAlias}"`
    })
  }

  const fieldSim = levenshteinSimilarity(normalizedSourceAlias, normalizedTargetAlias)
  if (fieldSim > 0.8) {
    score += 0.15
    reasons.push({
      type: 'name_match',
      score: 0.15,
      detail: `Field aliases are ${Math.round(fieldSim * 100)}% similar`
    })
  }

  // ---- Value overlap ----
  const overlapScore = computeValueOverlap(
    sourceFieldName,
    sourceRows,
    targetFieldName,
    targetRows
  )
  if (overlapScore > 0) {
    score += overlapScore
    const detail =
      overlapScore >= 0.4
        ? `High value overlap between "${sourceFieldName}" and "${targetFieldName}"`
        : `Moderate value overlap between "${sourceFieldName}" and "${targetFieldName}"`
    reasons.push({ type: 'value_overlap', score: overlapScore, detail })
  }

  // ---- Type compatibility ----
  const sourceTypeStr = sourceFieldType.toLowerCase()
  const targetTypeStr = targetFieldType.toLowerCase()
  const compatible = areTypesCompatible(sourceTypeStr, targetTypeStr)
  if (compatible) {
    score += 0.05
    reasons.push({
      type: 'type_compatibility',
      score: 0.05,
      detail: `Types ${sourceFieldType} and ${targetFieldType} are compatible`
    })
  } else if (sourceTypeStr !== 'text' && targetTypeStr !== 'text') {
    score -= 0.1
    reasons.push({
      type: 'type_compatibility',
      score: -0.1,
      detail: `Types ${sourceFieldType} and ${targetFieldType} are incompatible`
    })
  }

  const confidence = Math.max(0, Math.min(1, score))
  return { confidence, reasons }
}

function computeValueOverlap(
  sourceFieldName: string,
  sourceRows: Record<string, any>[],
  targetFieldName: string,
  targetRows: Record<string, any>[]
): number {
  const sourceValues = sourceRows
    .map((r) => String(r[sourceFieldName] ?? ''))
    .filter((v) => v !== '')

  if (sourceValues.length === 0) return 0

  const targetValues = new Set(
    targetRows
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
    .replace(/[\/\\?%*:|"<>\s\-.]+/g, '_')
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const distance = matrix[b.length][a.length]
  const maxLen = Math.max(a.length, b.length)
  return 1 - distance / maxLen
}
