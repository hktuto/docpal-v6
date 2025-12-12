<script lang="ts" setup>
import { clientApi } from 'api'
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/vxeTableRender.ts'
import { formSlotOrderDisplayColumns } from '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/reorderColumn'
const platform = useAppPlatform()
const { setting, displayColumns, dates, sql } = defineProps<{
  setting: any
  displayColumns: any
  dates: any
  sql: string
}>()
const { setOriginalData, handleFilterData, setFilterParams, ResponsiveFilterRef, initFilter } = useStatsTableFilter(setting, sql)
const CMDProvider = inject(CaseManagementDashboardKey)
const caseId = CMDProvider?.instanceId?.value || null
const { t } = useI18n()
const emits = defineEmits(['close'])
const tabProvider = inject(TabManagerKey)
let inFilter = false
const tableReady = ref(false)
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'dashboardRelatedCaseTable',
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
    const response: any = await clientApi.api.getPostgrestTable(`${setting.tableName}?${sql}`)
    const data = groupTree(response.data)
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
  },
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
  }, 200)
}
function closeDialog() {
  emits('close')
}
watch(
  () => setting?.displayColumns,
  (newVal) => {
    try {
      reorderColumn(newVal)
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
  if (setting.groupField && setting.sortBy) {
    const groupData = data.reduce((prev: any, item: any) => {
      const groupField = item[setting.groupField] === 'null' || !item[setting.groupField] ? '-' : item[setting.groupField]
      const sortBy = item[setting.sortBy]
      if (!prev[groupField]) {
        prev[groupField] = {
          id: groupField,
          [setting.groupField]: groupField,
          [setting.sortBy]: 0,
          parent_id: null
        }
      }
      prev[groupField][setting.sortBy] += sortBy
      treeData.push({ ...item, parent_id: prev[groupField].id, id: item.case_id })
      return prev
    }, {})
    Object.values(groupData).forEach((item: any) => {
      treeData.push(item)
    })
  } else {
    treeData = data
  }
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
