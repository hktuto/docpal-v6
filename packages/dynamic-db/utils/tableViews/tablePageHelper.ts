import { buildPageParams } from '@packages/dynamic-db/utils/pageParams'
import { getDisplayColumns, updateViewColumnOrder } from '@packages/dynamic-db/utils/tableViews'
import { useUserPreference } from '../../../authApp/composables/useAuth'
import { ref } from 'vue'
import { newClientApi } from 'api'
const extraColumnConfig = {
  updateViewColumnCountMethod: () => {
    console.log('updateViewColumnCountMethod')
  },
  updateViewFilterSortGroup: () => {
    console.log('updateViewFilterSortGroup')
  }
}

function getViews(table: string, tableFields: any[]) {
  const preference = useUserPreference()
  const tableConfig = preference.value.tableSettings?.[table]
  if (!tableConfig?.columns?.length) {
    return tableFields.map((field: any) => {
      return {
        ...field,
        field: field.id,
        title: field.field_name_alias,
        type: field.business_type
      }
    })
  }
  return getDisplayColumns(tableConfig, tableFields)
}
function initTableConfig(table: string, tableFields: any[]) {
  const preference = useUserPreference()
  const tableSettings = (preference.value.tableSettings ??= {})
  const tableConfig = (tableSettings[table] ??= {})
  tableConfig.columns ??= tableFields.map((field: any) => ({
    id: field.id,
    hidden: field.hidden ?? false
  }))
  return tableConfig.columns
}
async function updatePreference() {
  const preference = useUserPreference()
  try {
    await newClientApi.putDmsUserSetting(preference.value as any)
  } catch (error) {
    console.error('updateColumn error', error)
  }
}
async function updateColumn(table: string, updateDatas: any[], tableFields: any[]) {
  const columns = initTableConfig(table, tableFields)
  columns.forEach((column: any) => {
    const updateData = updateDatas.find((data: any) => data.id === column.id)
    if (updateData) {
      column.hidden = updateData.hidden
    }
  })
  updatePreference()
}
function updateColumnOrder(table: string, columnId: string, targetFieldId: string, dragPos: 'left' | 'right', tableFields: any[]) {
  const columns = initTableConfig(table, tableFields)
  updateViewColumnOrder(columns, columnId, targetFieldId, dragPos)
  updatePreference()
}
export const generateColumnConfig = (tableName: string, columnSettings: any[]) => {
  let table = tableName
  const tableRef = ref<any>(null)
  const columns = ref<any[]>([])
  const tableFields = ref<any[]>([])
  const columnFilterRules = ref<any>({
    conditions: [] as any[],
    conjunction: 'AND'
  })
  const columnSortRules = ref<any[]>([{ field: 'created_date', order: 'desc' }])
  const columnGroupRules = ref<any[]>([])
  function getPageParams(getGroup: boolean = false, getOrderBy: boolean = true) {
    return buildPageParams(
      {
        columnFilterRules: columnFilterRules.value,
        columnSortRules: columnSortRules.value,
        columnGroupRules: columnGroupRules.value,
        columns: columns.value
      },
      { group: getGroup, orderBy: getOrderBy }
    )
  }

  columns.value = getViews(table, columnSettings) as any[]
  tableFields.value = columnSettings
  function reload() {
    tableRef.value?.refreshTableData()
  }
  return {
    tableRef,
    reload,
    config: {
      columnFilterRules,
      columnSortRules,
      columnGroupRules,
      tableFields,
      columns,
      getPageParams,
      updatedViewColumnsConfig: (views: any[]) => {
        updateColumn(tableName, views, tableFields.value)
        columns.value = getViews(table, columnSettings) as any[]
      },
      saveColumnOrder: (columnId: string, targetFieldId: string, dragPos: 'left' | 'right') => {
        updateColumnOrder(tableName, columnId, targetFieldId, dragPos, tableFields.value)
        columns.value = getViews(table, columnSettings) as any[]
      },
      ...extraColumnConfig
    }
  }
}
