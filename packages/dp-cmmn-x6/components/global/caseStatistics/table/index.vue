<script lang="ts" setup>
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { formSlotOrderDisplayColumns } from '@packages/dp-dashboard/components/formSlot/displayColumn/reorderColumn'
const platform = useAppPlatform()
const { setting, displayColumns, dates, sql, mode, name } = defineProps<{
  setting: any
  displayColumns: any
  dates: any
  sql: string
  mode: 'mock' | 'real'
  name: string
}>()
const { setOriginalData, handleFilterData, setFilterParams, ResponsiveFilterRef, initFilter, setSetting } = useStatsTableFilter(setting, sql)
const CMDProvider = inject(CaseManagementDashboardKey)
const caseId = CMDProvider?.instanceId?.value || null
const { t } = useI18n()
const emits = defineEmits(['close'])
const tabProvider = inject(TabManagerKey)
let inFilter = false
const tableReady = ref(false)
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: `dashboardCaseStatisticsTable-${name || 'default'}`,
  virtualScroll: true,
  optionalConfig: {
    treeConfig: {
      expandAll: true,
      rowField: 'id',
      parentField: 'parent_id',
      transform: true,
      indent: 20
    }
  },
  api: async (params: any) => {
    if (inFilter) {
      const filteredData = handleFilterData()
      const groupData = groupTree(filteredData)
      return groupData
    }
    const data = await getData()
    console.log('data', data)
    setOriginalData(data)
    initFilter()
    setTimeout(() => {
      tableRef.value.setAllTreeExpand(true)
    }, 100)
    return data
  },
  columns: [],
  dblClickAction: ({ row }) => {
    if (!row.case_id) return
    notiHandleView({ content: { caseInstanceId: row.case_id } }, tabProvider)
    emits('close')
  }
  // zoom: false,
  // saveColumnOrder: false
})

const dialogRef = ref()

async function reorderColumn(fields: any) {
  tableReady.value = false
  const columns = await formSlotOrderDisplayColumns(fields, tabProvider, closeDialog)

  if (!columns.find((item: any) => item.field === 'case_id')) {
    columns.unshift({
      field: 'case_id',
      title: 'Case ID',
      minWidth: 200
    })
  }
  if (setting.groupField && !columns.find((item: any) => item.field === setting.groupField)) {
    columns.unshift({
      field: setting.groupField,
      title: setting.groupField,
      minWidth: 200
    })
  }
  if (setting.groupField) {
    const groupColumn = columns.find((item: any) => item.field === setting.groupField)
    if (groupColumn) {
      groupColumn.treeNode = true
    }
    columns.splice(columns.indexOf(groupColumn), 1)
    columns.unshift(groupColumn)
  }
  tableConfig.columns = [...columns]

  setTimeout(() => {
    tableReady.value = true
    if (!!setting) setSetting(setting)
    initFilter()
  }, 200)
}
async function getData() {
  console.log('getData')
  if (mode === 'mock') {
    const data: any = []
    for (let i = 0; i < 100; i++) {
      const dataItem: any = {
        case_id: `case_id ${i}`
      }
      const displayColumns = JSON.parse(JSON.stringify(setting.displayColumns))
      displayColumns.forEach((item: any) => {
        switch (item.type) {
          case 'text':
          case 'short_text':
            dataItem[item.value] = `text ${i}`
            break
          case 'number':
          case 'float':
            const mockValue = Math.random() * 1000000 + 0.88
            dataItem[item.value] = mockValue
            break
          case 'date':
            dataItem[item.value] = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
            break
          case 'boolean':
            dataItem[item.value] = i % 2 === 0 ? 'Yes' : 'No'
            break
          default:
            dataItem[item.value] = `text ${i}`
            break
        }
      })
      data.push(dataItem)
    }
    return data
  }
  const response: any = await newClientApi.getPostgrestTable(`${setting.tableName}?${sql}`)
  return groupTree(response.data)
}
function closeDialog() {
  emits('close')
}
watch(
  () => setting?.displayColumns,
  (newVal) => {
    try {
      reorderColumn(newVal)
      if (mode === 'mock') {
        reload()
      }
    } catch (error) {
      console.log('error', error)
    }
  },
  {
    deep: true,
    immediate: true
  }
)
function groupTree(data: any[]) {
  let treeData: any = []
  if (setting.groupField && setting.countField) {
    const groupData = data.reduce((prev: any, item: any) => {
      const groupFieldValue = item[setting.groupField] === 'null' || !item[setting.groupField] ? '-' : item[setting.groupField]
      const countFieldValue = item[setting.countField]
      if (!prev[groupFieldValue]) {
        prev[groupFieldValue] = {
          id: groupFieldValue,
          [setting.groupField]: groupFieldValue,
          [setting.countField]: 0,
          parent_id: null
        }
      }
      prev[groupFieldValue][setting.countField] += countFieldValue
      treeData.push({ ...item, parent_id: prev[groupFieldValue].id, id: item.case_id })
      return prev
    }, {})
    Object.values(groupData).forEach((item: any) => {
      treeData.push(item)
    })
    treeData.sort((a: any, b: any) => b[setting.countField] - a[setting.countField])
  } else {
    treeData = data
  }
  console.log('treeData', treeData)
  return treeData
}
function handleFilterFormChange(form: any) {
  inFilter = true
  setFilterParams(form)
  reload()
  setTimeout(() => {
    inFilter = false
  }, 100)
}

onMounted(() => {
  console.log('setting', setting)
})
defineExpose({ reorderColumn, reload, query })
</script>

<template>
  <VxeGrid v-if="tableReady" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter ref="ResponsiveFilterRef" :inputPlaceHolder="$t('common_filter')" @form-change="handleFilterFormChange" inputKey="q" />
    </template>
  </VxeGrid>
  <DashboardActionHumanTaskDialog ref="dialogRef" @refresh="reload()" />
</template>

<style lang="scss" scoped>
// .tableActions {
//   display: flex;
//   flex-flow: row nowrap;
//   justify-content: flex-start;
//   align-items: center;
//   width: 100%;
//   overflow: hidden;
//   gap: var(--app-space-s);
//   .responsive-container {
//     flex: 1 0 auto;
//     width: auto;
//   }
// }
:deep(.el-input) {
  width: 200px;
}
</style>
