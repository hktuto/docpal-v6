<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
        <el-button
          :loading="state.loading"
          id="ActiveWorkflowManagement__Delete"
          v-show="state.selectedRows.length > 0"
          type="danger"
          @click="handleDeleteSelected()"
        >
          {{ $t('common_delete') }}
        </el-button>
      </template>
    </VxeGrid>
    <WorkflowReallocateDialog ref="ReallocateDialogRef" @success="query({})"></WorkflowReallocateDialog>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const state = reactive<any>({
  selectedRows: [],
  loading: false
})
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-workflow-manage',
  api: async (pageParams: any) => {
    state.selectedRows = []
    return await clientApi.admin.postAdmindocpalWorkflowTasksUser({ ...pageParams, ...extraParams })
  },
  columns: [
    { field: 'taskInstance.businessKey', title: 'workflow_ManageName', fixed: 'left', type: 'checkbox' },
    { field: 'taskInstance.processDefinitionName', title: 'workflow_workflowName' },
    { field: 'taskInstance.startUserId', title: 'workflow_ManageInitiator' },
    { field: 'assignee', title: 'workflow_assignee' },
    // { field: "taskInstance.startUserId", title: "role.creator" },
    {
      field: 'createDate',
      title: 'workflow_ManageStartDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'dueDate',
      title: 'workflow_dueDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'reallocation',
        name: 'workflow_ManageReallocateTask',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleReallocate(row)
        }
      },
      {
        code: 'delete',
        name: 'workflow_ManageDeleteTask',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      }
    ]
  ],
  selectChangeHander: (selectedRows: any[]) => {
    state.selectedRows = [...selectedRows]
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleReallocate(row)
  }
  // saveColumnOrder: false,
})

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('workflow_ManageDeleteWorkflowMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await clientApi.admin.deleteAdmindocpalWorkflowProcess({ processInstanceId: row.instanceId })
    routerProvider?.message.success(t('tip_deleteSuccessMsg', { modelName: t('workflow_WorkflowTasks'), name: null }))
    query({})
  } catch (error) {
    console.log(error)
  }
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(`${t('workflow_ManageDeleteWorkflowMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    state.loading = true
    const pList: any = []
    state.selectedRows.forEach((s: any) => pList.push(clientApi.admin.deleteAdmindocpalWorkflowProcess({ processInstanceId: s.instanceId }).then((res) => res.data)))

    await Promise.all(pList)

    routerProvider?.message.success(t('tip_deleteSuccessMsg', { modelName: t('workflow_WorkflowTasks'), name: null }))
    query({})
  } catch (error) {
  } finally {
    state.selectedRows = []
    state.loading = false
  }
}

const ReallocateDialogRef = ref()

function handleReallocate(row: any) {
  ReallocateDialogRef.value.handleOpen(row)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  console.log(formModel)
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
        { label: 'workflow_assignee', value: 'assignee' },
        { label: 'workflow_ManageName', value: 'taskInstance.businessKey' },
        { label: 'workflow_ManageInitiator', value: 'taskInstance.startUserId' },
        { label: 'workflow_ManageStartDate', value: 'createDate' },
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
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 50%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
