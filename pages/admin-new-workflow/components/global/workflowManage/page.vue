<script lang="ts" setup>
import { routeWorkflowManageEditor } from '#imports'
import { newAdminApi } from 'api'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const workflowManageDialogRef = ref()
const workflowManageDuplicateRef = ref()
const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'admin-new-workflow-manage',
  saveColumnOrder: false,
  api: async (pageParams: any) => {
    const params = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum + 1
    }
    return await getData(params)
  },
  columns: [
    { field: 'key', title: 'Workflow Key', fixed: 'left' },
    { field: 'name', title: 'workflow_workflowName' },
    { field: 'draft_content.description', title: 'Description' },
    { field: 'status', title: 'Status' },
    {
      field: 'created_at',
      title: 'Create Date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit_info',
        name: 'workflowEditor.editInfo',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEditInfo(row)
        }
      },
      {
        code: 'duplicate',
        name: 'actions.duplicate',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDuplicate(row)
        }
      },
      {
        code: 'activate',
        name: t('actions.active'),
        action: async ({ row }: { row: any }) => {
          await handleActiveAndInactive(row, true)
        }
      },
      {
        code: 'deactivate',
        name: t('actions.inactive'),
        action: async ({ row }: { row: any }) => {
          await handleActiveAndInactive(row, false)
        }
      },
      {
        code: 'remove',
        name: 'common_remove',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleRemove(row)
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }: { row: any; code?: string }) => {
    if (!row) {
      return { visible: false, disabled: false }
    }

    // Show edit action for all user groups
    if (code === 'edit_info') {
      return {
        visible: row.status === 'D',
        disabled: false
      }
    }

    if (code === 'duplicate') {
      return {
        visible: true,
        disabled: false
      }
    }

    // Show activate action only for inactive user groups
    if (code === 'activate') {
      return {
        visible: row.status === 'D',
        disabled: false
      }
    }

    // Show deactivate action only for active user groups
    if (code === 'deactivate') {
      return {
        visible: row.status === 'A',
        disabled: false
      }
    }

    if (code === 'remove') {
      return {
        visible: row.status === 'D',
        disabled: false
      }
    }

    return {
      visible: false,
      disabled: true
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDbClick(row)
  }
})

async function getData(params: any) {
  const data = await $api.post('https://132.148.160.191:8001/api/v1/workflow/definitions/page', params).then((r) => r.data)
  return {
    data: {
      entryList: data.items,
      totalSize: data.total
    }
  }
}

function handleDbClick(row: any) {
  try {
    const workflowEdit = routeWorkflowManageEditor({
      id: row.id,
      name: row.name
    })
    routerProvider?.navigateTo(workflowEdit)
  } catch (e) {
    console.log(e)
  }
}

function handleEditInfo(row: any) {
  workflowManageDialogRef.value.edit(row)
  reload()
}

function handleDuplicate(row: any) {
  workflowManageDuplicateRef.value.open(row)
  reload()
}

async function handleActiveAndInactive(row: any, status: boolean) {
  try {
    if (status) {
      const userId = useUserId()
      await $api.put(`https://132.148.160.191:8001/api/v1/workflow/definitions/instance/${row.id}/activate`, { user_id: userId.value }).then((r) => r.data)
    } else {
      await $api.put(`https://132.148.160.191:8001/api/v1/workflow/definitions/instance/${row.id}/deactivate`).then((r) => r.data)
    }
    reload()
  } catch (error) {
    console.error(error)
  }
}

async function handleRemove(row: any) {
  if (row.status === 'A') return

  try {
    await $api.delete(`https://132.148.160.191:8001/api/v1/workflow/definitions/instance/${row.id}`).then((r) => r.dada)
    reload()
  } catch (e) {
    console.log('')
  }
}

function openCreateDialog() {
  workflowManageDialogRef.value.open()
}
</script>

<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-button type="primary" id="Workflow__CreateWorkflow" @click="openCreateDialog">Create Workflow</el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
  </div>
  <workflowManageDialog ref="workflowManageDialogRef" @refresh="reload" />
  <workflowManageDuplicate ref="workflowManageDuplicateRef" />
</template>

<style lang="scss" scoped></style>
