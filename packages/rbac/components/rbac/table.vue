<script lang="ts" setup>
import { newAdminApi } from 'api'
import { useVxeTable } from '#imports'
import { useDebounceFn } from '@vueuse/core'
import { ResponsiveFilter } from '#components'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()

interface Role {
  id: number
  name: string
  parentRoleId?: number
  parentId?: number
  status: number
}

// default search value
const searchQuery = ref<{
  q?: string
  sort_by?: string
  sort_type?: string
  status?: number
  parentId?: string[]
}>({
  sort_by: 'updateTime',
  sort_type: 'DESC',
  status: 1
})
const ResponsiveFilterRef = ref()

function handleEdit(row: Role) {
  editDialogRef.value.open({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    status: row.status
  })
}

// Define table actions
const bodyActions: TableMenuActions[][] = [
  [
    {
      code: 'edit',
      name: t('common_edit'),
      action: ({ row }: { row: Role }) => {
        handleEdit(row)
      }
    },
    {
      code: 'activate',
      name: t('actions.active'),
      action: async ({ row }: { row: Role }) => {
        try {
          await newAdminApi.putDocpalAclRole({
            id: String(row.id),
            name: row.name,
            parentId: row.parentRoleId ? String(row.parentRoleId) : undefined,
            status: 1,
            type: 1
          })
          reload()
        } catch (error) {
          console.error('Failed to activate role:', error)
        }
      }
    },
    {
      code: 'deactivate',
      name: t('actions.inactive'),
      action: async ({ row }: { row: Role }) => {
        try {
          await newAdminApi.putDocpalAclRole({
            id: String(row.id),
            name: row.name,
            parentId: row.parentRoleId ? String(row.parentRoleId) : undefined,
            status: 2,
            type: 1
          })
          reload()
        } catch (error) {
          console.error('Failed to deactivate role:', error)
        }
      }
    },
    {
      code: 'delete',
      name: t('common_delete'),
      action: async ({ row }: { row: Role }) => {
        try {
          const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
          if (action !== 'confirm') return
          await newAdminApi.putDocpalAclRole({
            id: String(row.id),
            name: row.name,
            parentId: row.parentRoleId ? String(row.parentRoleId) : undefined,
            status: 3,
            type: 1
          })
          reload()
        } catch (error) {
          console.error('Failed to deactivate role:', error)
        }
      }
    }
  ]
]

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'admin-role-table',
  api: (pageParams: any) => {
    const defaultCondition = {
      column: 'type',
      type: 'EQ',
      values: '1'
    }
    const conditions: {
      column: string
      type: string
      values: any
    }[] = [defaultCondition]

    // Add search condition if exists
    if (searchQuery.value?.q) {
      conditions.push({
        column: 'name',
        type: 'LIKE',
        values: searchQuery.value.q
      })
    }

    // Add status filter if selected
    if (searchQuery.value?.status) {
      conditions.push({
        column: 'status',
        type: 'EQ',
        values: String(searchQuery.value.status)
      })
    }

    // Add parent role filter if selected
    if (searchQuery.value?.parentId && searchQuery.value.parentId.length > 0) {
      conditions.push({
        column: 'parentId',
        type: 'IN',
        values: searchQuery.value.parentId.join(',')
      })
    }

    // Add sort by filter if selected
    if (searchQuery.value?.sort_by) {
      conditions.push({
        column: searchQuery.value.sort_by,
        type: searchQuery.value.sort_type === 'ASC' ? 'ORDER_BY_ASC' : 'ORDER_BY_DESC',
        values: ''
      })
    }

    return newAdminApi.postDocpalAclRolePage({ ...pageParams, conditions })
  },
  columns: [
    {
      field: 'name',
      title: 'orgChart.editSidebar.roleLabel'
    },
    {
      field: 'parentRoleName',
      title: 'orgChart.editSidebar.parentRole'
    },
    {
      field: 'status',
      title: 'tableHeader_status',
      formatter: ({ cellValue }) => {
        return cellValue === 1 ? t('actions.active') : t('actions.inactive')
      }
    },
    {
      field: 'updateTime',
      title: 'tableHeader_lastModified',
      formatter: ({ cellValue }) => {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction({ row, column, event }) {
    handleEdit(row)
  },
  bodyActions,
  saveColumnOrder: true,
  zoom: true,
  refresh: true,
  remoteSort: true,
  remoteFilter: true,
  permissionMethod: (args: PermissionMethodParams) => {
    const {row,code} = args
    if (!row) {
      return { visible: false, disabled: false }
    }
    
    // Show edit action for all roles
    if (code === 'edit') {
      return {
        visible: true,
        disabled: false
      }
    }

    // Show activate action only for inactive roles
    if (code === 'activate') {
      return {
        visible: row.status === 2,
        disabled: false
      }
    }

    // Show deactivate action only for active roles
    if (code === 'deactivate') {
      return {
        visible: row.status === 1,
        disabled: false
      }
    }
    if (code === 'delete') {
      return {
        visible: !!row.parentId,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})

const { flatRole } = useRBAC()

async function initFilter() {
  ResponsiveFilterRef.value.init([
    {
      label: t('tableHeader_status'),
      key: 'status',
      isMultiple: false,
      value: [1],
      options: [
        {
          label: t('actions.active'),
          value: 1
        },
        {
          label: t('actions.inactive'),
          value: 2
        }
      ]
    },
    {
      label: t('orgChart.editSidebar.parentRole'),
      key: 'parentId',
      isMultiple: true,
      options: [
        ...flatRole.value.map((role) => ({
          label: role.name,
          value: role.id
        }))
      ]
    },
    {
      label: t('tableHeader.sortBy'),
      key: 'sort_by',
      isMultiple: false,
      value: ['updateTime'],
      options: [
        {
          label: t('tableHeader_name'),
          value: 'name'
        },
        {
          label: t('tableHeader_lastModified'),
          value: 'updateTime'
        },
        {
          label: t('orgChart.editSidebar.parentRole'),
          value: 'parentRoleName'
        },
        {
          label: t('tableHeader_status'),
          value: 'status'
        }
      ]
    },
    {
      label: t('tableHeader.sortOrder'),
      key: 'sort_type',
      isMultiple: false,
      value: ['DESC'],
      options: [
        {
          label: t('tableHeader.asc'),
          value: 'ASC'
        },
        {
          label: t('tableHeader.desc'),
          value: 'DESC'
        }
      ]
    }
  ])
}

function handleFilterFormChange(form: any) {
  searchQuery.value = form
  debouncedReload()
}

// Create debounced reload function
const debouncedReload = useDebounceFn(() => {
  reload()
}, 300)

onMounted(async () => {
  await initFilter()
})

// open create dialog
const createDialogRef = ref()
const editDialogRef = ref()

function handleAddRole() {
  createDialogRef.value.open()
}
</script>

<template>
  <div class="role-table-container">
    <vxe-grid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="tableActions">
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="q" />
          <ElButton id="Role__Table__Add" type="primary" @click="handleAddRole">{{ t('common_add') }}</ElButton>
        </div>
      </template>
    </vxe-grid>
    <RbacCreateDialog ref="createDialogRef" :roleOptions="flatRole" @success="reload" />
    <RbacEditRoleSidebar ref="editDialogRef" :roleOptions="flatRole" @success="reload" />
  </div>
</template>

<style scoped>
.role-table-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.search-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  width: 300px;
}

.tableActions {
  display: flex;
  gap: var(--app-space-s);
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  container-type: inline-size;
}
</style>
