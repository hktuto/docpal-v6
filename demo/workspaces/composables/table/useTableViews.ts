import type { ViewConfig } from '../../utils/db/schema/tableView'
import {
  parseViewConfigList,
  serializeViewConfigList,
  addView as addViewUtil,
  deleteView as deleteViewUtil,
  reorderViews as reorderViewsUtil,
  replaceViewInList,
  applyViewUpdates,
  getDisplayColumns,
  updateViewColumnDisplay,
  initViewColumnsOrder,
  updateViewColumnOrder
} from '../../utils/tableViews'

import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'
import type { ResultCfUserTableConfigResponseDTO } from 'api/src/generate/newClient'
import { v7 as uuidv7 } from 'uuid'

/**
 * View Context for view management
 */
export interface ViewContext {
  tableFields: Ref<any[]>
  currentView: Ref<ViewConfig | null>
  tableViews: Ref<ViewConfig[]>
  columnFilterRules: Ref<any[]>
  columnSortRules: Ref<any[]>
  columnGroupRules: Ref<any[]>
  viewStyleConfig: Ref<any>
  getViews: () => Promise<void>
  createView: (view: Partial<ViewConfig>) => Promise<ViewConfig>
  updateView: (viewId: string, updates: Partial<ViewConfig>) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
  reorderViews: (fromIndex: number, toIndex: number) => Promise<void>
  addField: (newColumns: any[], targetFieldId: string, dragPos?: 'left' | 'right') => Promise<void>
  deleteField: (fieldId: string) => Promise<void>
  updateField: (fieldName: string, updates: Partial<{ field_name: string; business_type: any; display_structure: any }>) => Promise<void>
  updatedViewColumnsConfig: (updates: Array<{ id: string; display: boolean }>) => Promise<void>
  updateViewFilterSortGroup: (fieldName: 'filterInfo' | 'sortInfo' | 'groupInfo' | 'style', value: any) => Promise<void>
  saveColumnOrder: (columnId: string, targetFieldId: string, dragPos: 'left' | 'right') => Promise<void>
}

export const TableViewsInjectKey: InjectionKey<ViewContext> = Symbol('TableViewsInjectKey')

export interface UseTableViewsOptions {
  tableId: Ref<string>
  reference_entity_id: Ref<string>
}
function generateViewId(prefix: string = 'tv'): string {
  return prefix + '_' + uuidv7()
}
export function useTableViews(options: UseTableViewsOptions) {
  const { tableId, reference_entity_id } = options

  const currentView = ref<ViewConfig | null>(null)
  const tableViews = ref<ViewConfig[]>([])
  const tableFields = ref<any[]>([])

  const columnFilterRules = ref<any[]>([])
  const columnSortRules = ref<any[]>([])
  const columnGroupRules = ref<any[]>([])

  const viewStyleConfig = ref<any>({
    cardCount: 5,
    coverFieldId: '',
    isColNameVisible: true,
    isCoverFit: true
  })
  async function getViews() {
    const data: ResultCfUserTableConfigResponseDTO = await newClientApi.getDocpalMasterTableUserConfig({
      tableId: tableId.value
    })
    let views = parseViewConfigList(data?.data?.tableConfig)

    if (!views.length) {
      const defaultViewId = generateViewId()
      views = addViewUtil([], {
        id: defaultViewId,
        name: '默认视图'
      })
      await saveViews(views)
    }
    tableFields.value = data.data?.tableFields ?? []
    tableViews.value = views
    setCurrentView(views[0].id)
  }
  function setCurrentView(view: ViewConfig | string) {
    if (typeof view === 'string') {
      const target = tableViews.value.find((v: ViewConfig) => v.id === view) ?? null
      if (!target) return
      currentView.value = target
    } else {
      currentView.value = view
    }
    if (currentView.value) {
      currentView.value.displayColumns = getDisplayColumns(currentView.value, tableFields.value)
      columnFilterRules.value = (currentView.value.filterInfo as FilterInfo) ?? {
        conditions: [],
        conjunction: 'and'
      }
      columnSortRules.value = currentView.value.sortInfo ? currentView.value.sortInfo : []
      columnGroupRules.value = currentView.value.groupInfo ?? []
      if (currentView.value.type !== 'table') {
        viewStyleConfig.value = currentView.value.style ?? {
          cardCount: 5,
          coverFieldId: '',
          isColNameVisible: true,
          isCoverFit: true
        }
      }
      console.log(currentView, viewStyleConfig)
    }
  }
  async function saveViews(views: ViewConfig[]) {
    await newClientApi.postDocpalMasterTableUserConfig({
      tableId: tableId.value,
      tableConfig: serializeViewConfigList(views)
    })
  }

  async function createView(partial: Partial<ViewConfig>) {
    const id = 'tv_' + uuidv7()
    const next = addViewUtil(tableViews.value, { ...partial, id })
    tableViews.value = next
    await saveViews(next)
    const created = next[next.length - 1]
    setCurrentView(created)
    ElMessage.success('视图已创建')
    return created
  }

  async function updateView(viewId: string, updates: Partial<ViewConfig>) {
    const view = tableViews.value.find((v) => v.id === viewId)
    if (!view) return
    const updated = applyViewUpdates(view, updates)
    tableViews.value = replaceViewInList(tableViews.value, viewId, updated)
    if (currentView.value?.id === viewId) currentView.value = updated
    await saveViews(tableViews.value)
    setCurrentView(viewId)
  }

  async function deleteView(viewId: string) {
    tableViews.value = deleteViewUtil(tableViews.value, viewId)
    if (currentView.value?.id === viewId) currentView.value = tableViews.value[0] ?? null
    await saveViews(tableViews.value)
    ElMessage.success('视图已删除')
  }

  async function reorderViews(fromIndex: number, toIndex: number) {
    tableViews.value = reorderViewsUtil(tableViews.value, fromIndex, toIndex)
    await saveViews(tableViews.value)
  }

  async function addField(newColumns: any[], targetFieldId: string, dragPos?: 'left' | 'right') {
    const oldFields = JSON.parse(JSON.stringify(tableFields.value))
    await newClientApi.postDynamicDbTableTableidFields(tableId.value, { fields: newColumns })
    await getViews()
    if (!dragPos) return
    // insert new field to the target field
    const newFields = JSON.parse(JSON.stringify(tableFields.value))
    const newFieldsOnly = newFields.filter((col2: any) => !oldFields.some((col1: any) => col1.id === col2.id))
    if (newFieldsOnly.length > 0) {
      await saveColumnOrder(newFieldsOnly[0].id, targetFieldId, dragPos)
    }
  }

  async function deleteField(fieldId: string) {
    await newClientApi.deleteDynamicDbTableFieldsFieldid(fieldId)
    const index = tableFields.value.findIndex((f: any) => f.id === fieldId)
    if (index !== -1) tableFields.value.splice(index, 1)
    if (currentView.value) currentView.value.displayColumns = getDisplayColumns(currentView.value, tableFields.value)
  }

  async function updateField(fieldName: string, updates: Partial<{ field_name: string; business_type: any; display_structure: any }>) {
    const index = tableFields.value.findIndex((f: any) => f.field_name === fieldName)
    if (index === -1) return
    const fieldId = (tableFields.value[index] as any).id as string
    const { data }: any = await newClientApi.putDynamicDbTableFieldsFieldid(fieldId, updates)
    if (data) {
      tableFields.value[index] = {
        ...tableFields.value[index],
        field_name_alias: updates.field_name,
        business_type: updates.business_type,
        display_structure: updates.display_structure
      }
    }
  }

  /**
   * 根据列显隐配置更新当前视图的 columns（display: true 显示，false 隐藏，对应 column.hidden = !display）
   */
  async function updatedViewColumnsConfig(updates: Array<{ id: string; display: boolean }>) {
    const view = currentView.value
    if (!view) return
    const updatedColumns = updateViewColumnDisplay(view, updates, tableFields.value)
    await updateView(view.id, { columns: updatedColumns })
  }
  async function saveColumnOrder(columnId: string, targetFieldId: string, dragPos: 'left' | 'right') {
    const view = currentView.value
    if (!view) return
    let updatedColumns = await initViewColumnsOrder(view.columns, tableFields.value)
    const targetFieldIndex = updatedColumns.findIndex((col: any) => col.id === targetFieldId)
    const positionNum = dragPos === 'left' ? 0 : 1
    updatedColumns = updateViewColumnOrder(updatedColumns, columnId, targetFieldIndex + positionNum)
    await updateView(view.id, { columns: updatedColumns })
  }
  async function updateViewFilterSortGroup(fieldName: 'groupInfo' | 'sortInfo' | 'filterInfo' | 'style', value: any) {
    const view = currentView.value
    if (!view) return
    // @ts-ignore
    currentView.value[fieldName] = value
    await updateView(view.id, { [fieldName]: value })
  }
  provide(TableViewsInjectKey, {
    tableFields,
    currentView,
    tableViews,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    getViews,
    createView,
    updateView,
    deleteView,
    reorderViews,
    addField,
    deleteField,
    updateField,
    updatedViewColumnsConfig,
    saveColumnOrder,
    updateViewFilterSortGroup,
    viewStyleConfig
  })

  return {
    setCurrentView,
    currentView,
    tableViews,
    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    getViews,
    createView,
    updateView,
    deleteView,
    reorderViews,
    addField,
    deleteField,
    updateField,
    updatedViewColumnsConfig,
    saveColumnOrder,
    updateViewFilterSortGroup
  }
}

/**
 * Use the view context from a parent component
 */
export function useTableViewsInject(): ViewContext {
  const context = inject(TableViewsInjectKey)
  if (!context) {
    throw new Error('ViewContext not found. Make sure useTableViews is called in a parent component.')
  }
  return context
}
