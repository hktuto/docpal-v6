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
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import formJson from './complete.vform.json'
import { newClientApi } from 'api'
import dayjs from 'dayjs'
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
  id: 'complete_task',
  api: (pageParams: any) => newClientApi.postDocpalWorkflowHistoryProcessWithoutVariables({
    ...pageParams,
    ...extraParams,
    completed: true,
    userId
  }),
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
      field: 'duration', title: 'workflow_duration',
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
  console.log(row, 'completeTask')
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeWorkflowDetail({
    ...row, name: row.businessKey,
    workflowType: 'completeTask'
  }), false)
}

async function claimTask(row: any) {
  await newClientApi.postWorkflowTaskClaim({
    taskId: row.id,
    userId
  })
  query({})
}

function getDownloadParams() {
  return {
    completed: true,
    userId,
    ...deepCopy(extraParams)
  }
}

function handleFormChange(data: any) {
  extraParams = Object.keys(data.formModel).reduce((prev: any, key: string) => {
    if (data.formModel[key] && data.formModel[key].length > 0)
      prev[key] = data.formModel[key]
    return prev
  }, {})
  reload()
}

const ResponsiveFilterRef = ref()

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'table_name', value: 'businessKey' },
        { label: 'workflow_workflowName', value: 'processDefinitionName' },
        { label: 'workflow_createDate', value: 'startTime' },
        { label: 'workflow_completeDate', value: 'completeDate' },
        { label: 'workflow_duration', value: 'duration' }
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
