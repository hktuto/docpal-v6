<template>
  <div>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
        />
        <FormRenderer :form-json="formJson" @formChange="handleFormChange" />
      </template>
      <template #assignee="{ row }">
        <el-tag v-if="row.assignee" round>{{ row.assignee || '' }}</el-tag>
        <el-button :id="`Workflow__ActiveTask__Detail__ClaimTask__${row.id}`" v-else type="primary" size="small"
                   round @click="claimTask(row)">
          {{ $t('workflow_claim') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import formJson from './active.vform.json'
import { newClientApi } from 'api'
import { routeWorkflowDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
// @ts-ignore
const userId: string = useUserId().value
let extraParams: any = {}
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'active_task',
  api: (pageParams: any) => newClientApi.postDocpalWorkflowTasksUser({
    ...pageParams,
    ...extraParams,
    interrelatedUserId: userId
  }),
  columns: [
    { field: 'taskInstance.businessKey', title: 'workflow_jobName', fixed: 'left' },
    { field: 'taskInstance.processDefinitionName', title: 'workflow_workflowName' },

    {
      field: 'name',
      title: 'workflow_taskName'
      //   slots: {
      //     default: "status",
      //   },
    },
    {
      field: 'assignee',
      title: 'workflow_assignee',
      slots: {
        default: 'assignee'
      }
    },
    {
      field: 'createDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        // @ts-ignore
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeWorkflowDetail({
    ...row,
    name: row.taskInstance.businessKey,
    workflowType: 'activeTask'
  }), false)
}

async function claimTask(row: any) {
  await newClientApi.postWorkflowTaskClaim({
    taskId: row.id,
    userId
  })
  query({})
}

function handleFormChange(data: any) {
  extraParams = Object.keys(data.formModel).reduce((prev: any, key: string) => {
    if (data.formModel[key] && data.formModel[key].length > 0)
      prev[key] = data.formModel[key]
    return prev
  }, {})
  reload()
}

function getDownloadParams() {
  return {
    interrelatedUserId: userId,
    ...deepCopy(extraParams)
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'workflow_jobName', value: 'taskInstance.businessKey' },
        { label: 'workflow_assignee', value: 'assignee' },
        { label: 'workflow_createDate', value: 'createDate' },
        { label: 'workflow_taskName', value: 'name' },
        { label: 'workflow_workflowName', value: 'taskInstance.processDefinitionName' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  // getFilter()
})

defineExpose({ getDownloadParams })
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
