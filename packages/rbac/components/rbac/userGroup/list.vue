<template>
  <div class="pageContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="tableActions">

          <ResponsiveFilter
            ref="filterRef"
            :initValue="searchQuery"
            inputKey="q"
            @form-change="handleFilterFormChange"
          />
          <ElButton type="primary" @click="createRoleDialogRef.open({type: 2})">{{ t('common_add') }}</ElButton>
        </div>
      </template>
    </VxeGrid>
    <RbacCreateDialog
      ref="createRoleDialogRef"
      @success="reload"
    />
    <RbacEditRoleSidebar
      ref="editRoleSidebarRef"
      :role-id="selectedRoleId"
      :role-options="flatRole"
      @success="reload"
      @close="reload"
    />
  </div>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ResponsiveFilter } from '#components'

interface UserGroup {
  id: number
  name: string
  userIds: string[]
  status: number
  createTime: string
  updateTime: string
}

interface SearchQuery {
  q?: string
  sort_by?: string
  sort_type?: string
  status?: number
}

interface Condition {
  column: string
  type: string
  values: any
}

const editRoleSidebarRef = ref()
const selectedRoleId = ref()
const { flatRole } = useRBAC()
const filterRef = ref()
const conditions = reactive<Condition[]>([])
const createRoleDialogRef = ref()
const searchQuery = ref<SearchQuery>({
  sort_by: 'updateTime',
  sort_type: 'DESC',
  status: 1
})

function dblClickHandler(row: UserGroup) {
  selectedRoleId.value = row.id
  editRoleSidebarRef.value.open({ ...row })
}

const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'userGroupList',
  api: async (params: any) => {
    const defaultCondition = [{
      column: 'type',
      type: 'EQ',
      values: '2'
    }]

    // Add search condition if exists
    if (searchQuery.value?.q) {
      defaultCondition.push({
        column: 'name',
        type: 'LIKE',
        values: searchQuery.value.q
      })
    }

    // Add status filter if selected
    if (searchQuery.value?.status) {
      defaultCondition.push({
        column: 'status',
        type: 'EQ',
        values: String(searchQuery.value.status)
      })
    }

    // Add sort by filter if selected
    if (searchQuery.value?.sort_by) {
      defaultCondition.push({
        column: searchQuery.value.sort_by,
        type: searchQuery.value.sort_type === 'ASC' ? 'ORDER_BY_ASC' : 'ORDER_BY_DESC',
        values: ''
      })
    }

    return await newAdminApi.postDocpalAclRolePage({
      ...params,
      conditions: [...defaultCondition]
    })
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('common_edit'),
        action: ({ row }: { row: UserGroup }) => {
          dblClickHandler(row)
        }
      },
      {
        code: 'activate',
        name: t('actions.active'),
        action: async ({ row }: { row: UserGroup }) => {
          try {
            await newAdminApi.putDocpalAclRole({
              id: String(row.id),
              name: row.name,
              status: 1,
              type: 2
            })
            reload()
          } catch (error) {
            console.error('Failed to activate user group:', error)
          }
        }
      },
      {
        code: 'deactivate',
        name: t('actions.inactive'),
        action: async ({ row }: { row: UserGroup }) => {
          try {
            await newAdminApi.putDocpalAclRole({
              id: String(row.id),
              name: row.name,
              status: 3,
              type: 2
            })
            reload()
          } catch (error) {
            console.error('Failed to deactivate user group:', error)
          }
        }
      }
    ]
  ],
  dblClickAction: ({ row }: { row: UserGroup }) => {
    dblClickHandler(row)
  },
  permissionMethod: ({ row, code }: { row: UserGroup; code?: string }) => {
    if (!row) {
      return { visible: false, disabled: false }
    }

    // Show edit action for all user groups
    if (code === 'edit') {
      return {
        visible: true,
        disabled: false
      }
    }

    // Show activate action only for inactive user groups
    if (code === 'activate') {
      return {
        visible: row.status === 3,
        disabled: false
      }
    }

    // Show deactivate action only for active user groups
    if (code === 'deactivate') {
      return {
        visible: row.status === 1,
        disabled: false
      }
    }

    return {
      visible: false,
      disabled: true
    }
  },
  columns: [
    {
      title: 'table_name',
      field: 'name'
    },
    {
      title: 'user',
      field: 'userIds',
      formatter: ({ cellValue }: { cellValue: string[] }) => cellValue.join(',')
    },
    {
      title: 'Created At',
      field: 'createTime',
      formatter: ({ cellValue }: { cellValue: string }) => formatDate(cellValue)
    },
    {
      title: 'Modified At',
      field: 'updateTime',
      formatter: ({ cellValue }: { cellValue: string }) => formatDate(cellValue)
    },
    {
      title: 'Status',
      field: 'status',
      formatter: ({ cellValue }: { cellValue: number }) => cellValue === 1 ? 'Active' : 'Inactive'
    }
  ],
  remoteSort: true,
  remoteFilter: true
})

// Initialize filters
onMounted(() => {
  filterRef.value.init([
    {
      label: t('tableHeader_status'),
      key: 'status',
      isMultiple: false,
      options: [
        { label: t('actions.active'), value: 1 },
        { label: t('actions.inactive'), value: 3 }
      ]
    },
    {
      label: t('tableHeader.sortBy'),
      key: 'sort_by',
      isMultiple: false,
      options: [
        {
          label: t('tableHeader_name'),
          value: 'name'
        },
        {
          label: t('tableHeader_createdAt'),
          value: 'createTime'
        },
        {
          label: t('tableHeader_lastModified'),
          value: 'updateTime'
        }
      ]
    },
    {
      label: t('tableHeader.sortOrder'),
      key: 'sort_type',
      isMultiple: false,
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
})

const debounceFilter = useDebounceFn(() => {
  reload()
}, 300)

// Handle filter changes
function handleFilterFormChange(form: SearchQuery) {
  conditions.length = 0
  searchQuery.value = form

  if (form.status) {
    conditions.push({
      column: 'status',
      type: 'EQ',
      values: form.status
    })
  }
  if (form.q) {
    conditions.push({
      column: 'name',
      type: 'LIKE',
      values: form.q
    })
  }
  if (form.sort_by) {
    conditions.push({
      column: form.sort_by,
      type: form.sort_type === 'ASC' ? 'ORDER_BY_ASC' : 'ORDER_BY_DESC',
      values: ''
    })
  }
}

watch(conditions, (newVal) => {
  debounceFilter()
})

</script>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  padding: var(--app-spacing-s);
}

.tableActions {
  display: flex;
  gap: var(--app-spacing-s);
  align-items: center;
  justify-content: flex-start;
}
</style>
