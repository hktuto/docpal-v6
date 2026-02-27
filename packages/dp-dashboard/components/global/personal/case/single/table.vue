<script lang="ts" setup>
import { newClientApi } from 'api'
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formSlotOrderDisplayColumns } from '../../../../formSlot/displayColumn/reorderColumn'
import '../../../../formSlot/displayColumn/vxeTableRender.ts'


const platform = useAppPlatform()
const { id, name, detail, displayColumns } = defineProps<{
  id: string
  name: string
  detail: any
}>()
let where = ref({})
const { t } = useI18n()
const emits = defineEmits(['filter-change', 'refresh'])
const routerProvider = inject(MenuRouterKey)
const tabProvider = inject(TabManagerKey)
type TableState = {
  columns: any
  where: any[]
}
const caseEvents = ref<any>([])
const tableReady = ref(false)
const instanceId = ref('')
const caseDefinitionKey = ref('')
const productionVersionId = ref('')
const caseTypeId = ref('')
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'clientCaseTableList',
  api: async (pageParams: any) => {
    if (platform.value === 'admin') {
      return {
        entryList: [],
        totalSize: 0
      }
    }
    pageParams.isDesc = true
    pageParams.orderBy = 'created_date'
    if (Object.entries(where.value).length !== 0) {
      if (where.value.q) {
        pageParams.q = where.value.q
      }
      delete where.value.q
      pageParams.where = { ...where.value }
    }
    return newClientApi.postCaseTypesCasetypeidRecordsPage(id, pageParams)
  },
  columns: [],
  dblClickAction: ({ row }) => {
    const newItem = caseManageDashboardPage({ ...row, id, instanceId: row.case_id, versionId: row.caseDefinitionVersionId, data: detail })
    console.log(newItem)
    routerProvider?.navigateTo(newItem)
  },
  zoom: false,
  saveColumnOrder: false
})
// getCaseDashboardInstanceCaseidActions

async function getActions(row: any) {
  try {
    caseEvents.value = await newClientApi
      .getCaseDashboardInstanceCaseidActions(row.case_id)
      .then((res) => res.data?.filter((s) => s.state !== 'completed').sort((a: any, b: any) => a.name.localeCompare(b.name)))
  } catch (error) {
    caseEvents.value = []
  }
}
const dialogRef = ref()
async function handleTask(actionItem: any, row?: any) {
  if (actionItem.planItemDefinitionType === 'humantask') {
    dialogRef.value.handleOpen(actionItem.referenceId, actionItem)
  } else if (actionItem.planItemDefinitionType === 'usereventlistener') {
    await newClientApi.postCaseInstanceTriggerEvent({ caseInstanceId: actionItem.caseInstanceId, planItemDefinitionId: actionItem.planItemDefinitionId })
    // await completeEventTaskApi(actionItem.id, actionItem.planItemDefinitionId)
    ElMessage.success(t('dpMsg_success'))
    emits('refresh')
  } else if (actionItem.planItemDefinitionType === 'processtask') {
    console.log('handleTask', actionItem, row)
    const caseInstanceId = actionItem.caseInstanceId
    const res = await newClientApi.postCaseDashboardInstanceActionPreRequisite({ id: actionItem.id }).then((res) => res.data)
    // Get Form Json and XML

    // check start event additional setting
    const routerItem = caseProcessTaskFormPage({
      caseInstanceId: row.case_id,
      actionStepId: actionItem.id,
      label: actionItem.name,
      backItem: routerProvider?.tabData.value
    })
    routerProvider?.navigateTo(routerItem)
  }
}
async function reorderColumn(fields: any) {
  console.log('reorderColumn', fields)
  try {
    const columns = [
      {
        title: 'dpTable_actions',
        width: 80,
        fixed: 'right',
        slots: {
          default: 'dpActions'
        }
      }
    ]
    const _columns = await formSlotOrderDisplayColumns(fields, tabProvider)
    tableConfig.columns = [..._columns, ...columns]
    console.log('tableConfig.columns', tableConfig.columns)
  } catch (e) {
    console.log('error', e)
  }
  tableReady.value = true
}
const responsiveFilterRef = ref()
function handleFilterFormChange(formModel) {
  where.value = formModel
  reload()
}
provide(CaseManagementDashboardKey, {
  instanceId,
  caseTypeId,
  caseDefinitionKey,
  versionId: productionVersionId
})
watch(
  () => detail,
  (newVal) => {
    caseTypeId.value = newVal?.id ? newVal.id : ''
    caseDefinitionKey.value = newVal?.caseDefinitionKey ? newVal.caseDefinitionKey : ''
    productionVersionId.value = newVal?.productionVersionId ? newVal.productionVersionId : ''
  }
)
defineExpose({ reorderColumn, reload, query })
</script>

<template>
  <VxeGrid v-if="tableReady" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <div class="tableActions">
        <ResponsiveFilter ref="responsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" inputPlaceHolder="caseManagement_filter" />
        <slot name="table_right" />
      </div>
    </template>
    <template #dpActions="{ row }">
      <el-dropdown trigger="click">
        <span class="el-dropdown-link">
          <el-button text @click="getActions(row)">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
        </span>
        <template #dropdown>
          <el-dropdown-menu v-if="caseEvents.length > 0">
            <el-dropdown-item v-for="item in caseEvents" :key="item.id" @click.stop="handleTask(item, row)">
              {{ item.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
          <div v-else>{{$t('noData')}}</div>
        </template>
      </el-dropdown>
    </template>
  </VxeGrid>
  <DashboardActionHumanTaskDialog ref="dialogRef" @refresh="reload()" />
</template>

<style lang="scss" scoped>
.tableActions {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  overflow: hidden;
  gap: var(--app-space-s);
  .responsive-container {
    flex: 1 0 auto;
    width: auto;
  }
}
:deep(.el-input ){
  width: 200px;
}
</style>
