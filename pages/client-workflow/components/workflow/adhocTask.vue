<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ElDropdown @command="handleCommand">
          <span class="el-dropdown-link">
            {{ $t('status.' + activeTab) }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem :disabled="activeTab === 'pendingApproval'" command="pendingApproval">{{ $t('status.pendingApproval') }}</ElDropdownItem>
              <ElDropdownItem :disabled="activeTab === 'submitted'" command="submitted">{{ $t('status.submitted') }}</ElDropdownItem>
              <ElDropdownItem :disabled="activeTab === 'completed'" command="completed">{{ $t('status.completed') }}</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import dayjs from 'dayjs'
import { ArrowDown } from '@element-plus/icons-vue'
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps<{
  subTab?: any
}>()
const { t } = useI18n()
// @ts-ignore
const userId: string = useUserId().value
let extraParams: any = {}
const activeTab = ref('pendingApproval')
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'adHocPage',
  api: async (pageParams: any) => {
    handleTableChange()
    return await newClientApi.postDocpalWorkflowQueryadhocapprovalpage({ ...pageParams, ...extraParams })
  },
  columns: [
    { field: 'businessKey', title: 'table_name', fixed: 'left' },
    { field: 'processDefinitionName', title: 'workflow_workflowName' },
    {
      field: 'startTime',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'completeDate',
      title: 'workflow_completeDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    },
    {
      field: 'duration',
      title: 'workflow_duration',
      formatter({ cellValue, row }: any) {
        return dayjs(row.completeDate).diff(row.startTime, 'day') + ' ' + t('common_days')
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(
    createDetailPageParams({
      docName: row.businessKey,
      idOrPath: row.documentId,
      showHeaderAction: true
    }),
    false
  )
}

function handleTableChange() {
  switch (activeTab.value) {
    case 'submitted':
      extraParams = {
        user_creator_id: userId,
        processInstanceStatus: 0
      }
      tableConfig.columns = [
        { field: 'businessKey', title: 'table_name' },
        { field: 'documentPath', title: 'table_path' },
        { field: 'user_creator_id', title: 'role.creator' },
        {
          field: 'startTime',
          title: 'workflow_createDate',
          formatter({ cellValue }: any) {
            // @ts-ignore
            return formatDate(cellValue)
          }
        },
        { field: 'user_approver_id', title: 'role.approvers' },
      ]
      break
    case 'pendingApproval':
      extraParams = {
        user_approver_id: userId,
        processInstanceStatus: 0
      }
      tableConfig.columns = [
        { field: 'businessKey', title: 'table_name' },
        { field: 'documentPath', title: 'table_path' },
        { field: 'documentStartVersion', title: 'info_version', align: 'right' },
        { field: 'user_creator_id', title: 'role.creator' },
        {
          field: 'startTime',
          title: 'workflow_createDate',
          formatter({ cellValue }: any) {
            // @ts-ignore
            return formatDate(cellValue)
          }
        },
        { field: 'user_approver_id', title: 'role.approvers' },
      ]
      break
    case 'completed':
      extraParams = {
        participant: userId,
        isComplete: true
      }
      tableConfig.columns = [
        { field: 'businessKey', title: 'table_name' },
        { field: 'documentPath', title: 'table_path' },
        { field: 'documentApprovalVersion', title: 'info_version', align: 'right' },
        { field: 'user_creator_id', title: 'role.creator' },
        {
          field: 'startTime',
          title: 'workflow_createDate',
          formatter({ cellValue }: any) {
            // @ts-ignore
            return formatDate(cellValue)
          }
        },
        { field: 'user_approver_id', title: 'role.approvers' },
        {
          field: 'approvedDate',
          title: 'dpTable_approvedDate',
          formatter({ cellValue }: any) {
            // @ts-ignore
            return formatDate(cellValue)
          }
        }
      ]
      break
  }
}
function handleCommand(command: string) {
  activeTab.value = command
  routerProvider?.updateProps({
    query: {
      ...routerProvider?.tabData.value.props?.query,
      tab: 'adhocTask',
      subTab: command
    }
  })
  reload()
}

onMounted(() => {})

defineExpose({})
</script>
<style lang="scss" scoped>
:deep(.el-input){
  width: 200px;
}
</style>
