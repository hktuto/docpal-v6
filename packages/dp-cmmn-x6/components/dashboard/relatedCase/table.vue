<script lang="ts" setup>
import { newClientApi } from 'api'
import { MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formSlotOrderDisplayColumns } from '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/reorderColumn'
import '../../../../../packages/dp-dashboard/components/formSlot/displayColumn/vxeTableRender.ts'
const platform = useAppPlatform()
const { id, name, detail, relatedField } = defineProps<{
  id: string
  name: string
  detail: any
  relatedField: any
}>()

const CMDProvider = inject(CaseManagementDashboardKey)
const caseId = CMDProvider?.instanceId?.value || null
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
const pageParams: any = {
  pageNum: 0,
  pageSize: 20,
  orderBy: 'created_date',
  isDesc: true
}
const extraParams: any = {
  where: {
    [relatedField]: caseId
  }
}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'dashboardRelatedCaseTable',
  refresh: false,
  api: async (params: any) => {
    if (platform.value === 'admin') {
      return {
        entryList: [],
        totalSize: 0
      }
    }
    return newClientApi.postCaseTypesCasetypeidRecordsPage(id, { ...pageParams, ...params, ...extraParams })
  },
  columns: [],
  dblClickAction: ({ row }) => {
    const newItem = caseManageDashboardPage({ ...row, id, instanceId: row.case_id, versionId: row.caseDefinitionVersionId, data: detail })
    console.log(newItem)
    tabProvider?.openTab(newItem)
  },
  zoom: false,
  saveColumnOrder: false
})

const dialogRef = ref()

async function reorderColumn(fields: any) {
  console.log('fields', fields)
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
  } catch (e) {
    console.log('error', e)
  }
  tableReady.value = true
}
const responsiveFilterRef = ref()
function handleFilterFormChange(formModel) {
  if (formModel.q) {
    extraParams.where.caseId = formModel.q
  } else {
    delete extraParams.where.caseId
  }
  reload()
}
function filterActions(action: any) {
  if (action.planItemDefinitionType === 'processtask') {
    return action.state === 'available' || action.state === 'enabled'
  } else if (action.planItemDefinitionType === 'humantask') {
    return !!action.referenceId
  }
  return action.state !== 'completed'
}
async function getActions(row: any) {
  try {
    caseEvents.value = await newClientApi
      .getCaseDashboardInstanceCaseidActions(row.case_id)
      .then((res) => res.data?.filter((s) => s.state !== 'completed').sort((a: any, b: any) => a.name.localeCompare(b.name)))
    caseEvents.value = caseEvents.value.filter((s) => filterActions(s))
  } catch (error) {
    caseEvents.value = []
  }
}
async function handleTask(actionItem: any, row?: any) {
  if (actionItem.planItemDefinitionType === 'humantask') {
    dialogRef.value.handleOpen(actionItem.referenceId, actionItem)
  } else if (actionItem.planItemDefinitionType === 'usereventlistener') {
    await newClientApi.postCaseInstanceTriggerEvent({ caseInstanceId: actionItem.caseInstanceId, planItemDefinitionId: actionItem.planItemDefinitionId })
    // await completeEventTaskApi(actionItem.id, actionItem.planItemDefinitionId)
    ElMessage.success(t('dpMsg_success'))
    emits('refresh')
  } else if (actionItem.planItemDefinitionType === 'processtask') {
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
defineExpose({ reorderColumn, reload, query })
</script>

<template>
  <VxeGrid v-if="tableReady" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <!-- <template #toolbar_buttons>
      <div class="tableActions">
        <ResponsiveFilter ref="responsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" inputPlaceHolder="caseManagement_filter" />
        <slot name="table_right" />
      </div>
    </template> -->
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
:deep(.el-input) {
  width: 200px;
}
</style>
