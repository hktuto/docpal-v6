import type { MaybeRefOrGetter } from 'vue'
import { ElMessage } from 'element-plus'
import type { CaseTableRecord, CaseFieldRecord } from '../../utils/db/schema/newTableSchema'
import type { useTableView } from './useTableView'

const VALID_SUGGESTION_STATUSES = ['none', 'pending', 'processing', 'ready', 'error'] as const
export type SuggestionStatusType = (typeof VALID_SUGGESTION_STATUSES)[number]

export interface RelationCreatedPayload {
  targetTableId: string
  targetFieldId: string
  displayFieldNames: string[]
  relationColumnName: string
}

export interface SuggestionAcceptedPayload {
  suggestion: { id: string; sourceFieldId: string; targetTableId: string; targetTableName: string; targetFieldId: string }
  displayFieldNames: string[]
}

export interface AcceptSuggestionResult {
  success: true
  suggestion: { id: string; targetTableId: string }
}
export interface AcceptSuggestionError {
  success: false
  resetLoadingId?: string
}

/**
 * Form/State: 表格详情页「关联建议」状态与业务逻辑
 * 组件只负责绑定状态、派发事件、调用本 composable 提供的方法
 */
export function useTableDetailSuggestionState(
  dataTableId: MaybeRefOrGetter<string>,
  tableView: ReturnType<typeof useTableView>
) {
  const { query } = usePglite()
  const { getPendingSuggestions, acceptSuggestion, analyzeTableForRelations, dismissSuggestionsByTargetTable, dismissSuggestion } =
    useRelationSuggestions()

  const suggestionStatus = ref<SuggestionStatusType>('none')
  const suggestionCount = ref(0)
  const isAnalyzing = ref(false)
  const suggestionsByField = ref<Map<string, { count: number; fieldId: string }>>(new Map())
  const pendingRelationColumn = ref<{ field: { fieldName: string } } | null>(null)

  const tableId = computed(() => (typeof dataTableId === 'function' ? (dataTableId as () => string)() : unref(dataTableId)))

  async function loadSuggestionsByField() {
    try {
      const suggestions = await getPendingSuggestions(tableId.value)
      const fieldMap = new Map<string, { count: number; fieldId: string }>()
      for (const suggestion of suggestions) {
        const fieldData = await query<CaseFieldRecord>(`SELECT "fieldName" FROM case_fields WHERE id = $1`, [
          suggestion.sourceFieldId
        ])
        if (fieldData.length > 0) {
          const fieldName = fieldData[0].fieldName
          const existing = fieldMap.get(fieldName)
          if (existing) {
            existing.count++
          } else {
            fieldMap.set(fieldName, { count: 1, fieldId: suggestion.sourceFieldId })
          }
        }
      }
      suggestionsByField.value = fieldMap
    } catch (error) {
      console.error('Error loading suggestions by field:', error)
    }
  }

  async function loadSuggestionStatus() {
    try {
      const tableData = await query<CaseTableRecord>(`SELECT "suggestionStatus", "entityId" FROM case_tables WHERE id = $1`, [
        tableId.value
      ])
      if (tableData.length === 0) return

      const currentStatus = (tableData[0].suggestionStatus || 'none') as SuggestionStatusType
      suggestionStatus.value = currentStatus

      if (currentStatus === 'ready') {
        const suggestions = await getPendingSuggestions(tableId.value)
        suggestionCount.value = suggestions.length
        await loadSuggestionsByField()
      } else {
        suggestionsByField.value = new Map()
      }

      if (currentStatus === 'pending' && !isAnalyzing.value) {
        runAnalysis(tableData[0].reference_entity_id)
      }
    } catch (error) {
      console.error('Error loading suggestion status:', error)
    }
  }

  async function runAnalysis(entityId: string) {
    if (isAnalyzing.value) return
    try {
      isAnalyzing.value = true
      suggestionStatus.value = 'processing'
      await query(
        `UPDATE case_tables SET "suggestionStatus" = 'processing', "updatedAt" = $1 WHERE id = $2`,
        [new Date(), tableId.value]
      )

      const suggestionsCount = await analyzeTableForRelations(tableId.value, entityId)
      const newStatus: SuggestionStatusType = suggestionsCount > 0 ? 'ready' : 'none'
      await query(
        `UPDATE case_tables SET "suggestionStatus" = $1, "updatedAt" = $2 WHERE id = $3`,
        [newStatus, new Date(), tableId.value]
      )
      suggestionStatus.value = newStatus
      suggestionCount.value = suggestionsCount

      if (suggestionsCount > 0) {
        await loadSuggestionsByField()
      } else {
        suggestionsByField.value = new Map()
      }
      if (suggestionsCount > 0) {
        ElMessage.success({
          message: `Found ${suggestionsCount} relation suggestion${suggestionsCount > 1 ? 's' : ''}!`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('[TableDetailSuggestionState] Error during analysis:', error)
      await query(
        `UPDATE case_tables SET "suggestionStatus" = 'error', "updatedAt" = $1 WHERE id = $2`,
        [new Date(), tableId.value]
      )
      suggestionStatus.value = 'error'
      ElMessage.error('Failed to analyze table for relation suggestions')
    } finally {
      isAnalyzing.value = false
    }
  }

  async function updateSuggestionStatusAfterChange() {
    await loadSuggestionStatus()
    if (suggestionCount.value === 0 && suggestionStatus.value === 'ready') {
      await query(`UPDATE case_tables SET "suggestionStatus" = 'none', "updatedAt" = $1 WHERE id = $2`, [
        new Date(),
        tableId.value
      ])
      suggestionStatus.value = 'none'
    }
  }

  function setPendingRelationColumn(column: { field: { fieldName: string } } | null) {
    pendingRelationColumn.value = column
  }

  /** 创建关联（从「创建关联」对话框提交）：只做状态与持久化，不操作 UI */
  async function relationCreated(
    data: RelationCreatedPayload
  ): Promise<{ success: true; targetTableId: string } | { success: false; message?: string }> {
    const column = pendingRelationColumn.value
    if (!column) return { success: false }
    try {
      const sourceFieldName = column.field?.fieldName ?? column.field
      await tableView.createRelationFromColumn(
        sourceFieldName,
        data.targetTableId,
        data.targetFieldId,
        data.displayFieldNames,
        data.relationColumnName
      )
      await dismissSuggestionsByTargetTable(tableId.value, data.targetTableId)
      await updateSuggestionStatusAfterChange()
      pendingRelationColumn.value = null
      return { success: true, targetTableId: data.targetTableId }
    } catch (error) {
      console.error('Error creating relation:', error)
      ElMessage.error('Failed to create relation column')
      return { success: false, message: (error as Error).message }
    }
  }

  /** 从建议接受并创建关联（弹窗/列表）：返回结果供组件更新对话框 UI */
  async function acceptSuggestionAndCreateRelation(
    data: SuggestionAcceptedPayload
  ): Promise<AcceptSuggestionResult | AcceptSuggestionError> {
    const { suggestion, displayFieldNames } = data
    try {
      const sourceFieldData = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE id = $1`, [
        suggestion.sourceFieldId
      ])
      if (sourceFieldData.length === 0) {
        ElMessage.error('Source field not found')
        return { success: false, resetLoadingId: suggestion.id }
      }
      const sourceField = sourceFieldData[0]
      await tableView.createRelationFromColumn(
        sourceField.fieldName,
        suggestion.targetTableId,
        suggestion.targetFieldId,
        displayFieldNames,
        `${sourceField.fieldNameAlias} → ${suggestion.targetTableName}`
      )
      await acceptSuggestion(suggestion.id)
      await dismissSuggestionsByTargetTable(tableId.value, suggestion.targetTableId)
      await updateSuggestionStatusAfterChange()
      ElMessage.success('Relation created from suggestion')
      return { success: true, suggestion: { id: suggestion.id, targetTableId: suggestion.targetTableId } }
    } catch (error) {
      console.error('Error creating relation from suggestion:', error)
      ElMessage.error('Failed to create relation')
      return { success: false, resetLoadingId: suggestion.id }
    }
  }

  async function onSuggestionDismissed() {
    await updateSuggestionStatusAfterChange()
  }

  async function onAllSuggestionsDismissed() {
    await query(`UPDATE case_tables SET "suggestionStatus" = 'none', "updatedAt" = $1 WHERE id = $2`, [
      new Date(),
      tableId.value
    ])
    await loadSuggestionStatus()
  }

  async function dismissColumnSuggestion(suggestionId: string) {
    await dismissSuggestion(suggestionId)
    await updateSuggestionStatusAfterChange()
  }

  return {
    suggestionStatus,
    suggestionCount,
    isAnalyzing,
    suggestionsByField,
    pendingRelationColumn,
    tableId,
    loadSuggestionStatus,
    loadSuggestionsByField,
    runAnalysis,
    updateSuggestionStatusAfterChange,
    setPendingRelationColumn,
    relationCreated,
    acceptSuggestionAndCreateRelation,
    onSuggestionDismissed,
    onAllSuggestionsDismissed,
    dismissColumnSuggestion
  }
}
