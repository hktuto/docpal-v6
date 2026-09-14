<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <header v-show="state.selectList?.length > 0" class="header-flex">
        <div class="title-select color__primary">
          <b class="el-icon--left"> {{ $t('notifications.userSelected') }}: {{ state.selectList.length }} </b>
          <Icon id="UserList__ClearSelected" name="ic:baseline-clear" class="normal cursor-pointer" @click="cleanSelectedRows"></Icon>
        </div>
        <div class="flex-x-end">
          <el-button id="UserList__Delete" type="danger" @click="handleDelete()">
            {{ $t('common_delete') }}
          </el-button>
          <el-divider direction="vertical" />
          <el-dropdown placement="top-start">
            <el-button id="UserList__Active" type="primary" class="el-icon--left el-icon--right">
              {{ $t('actions.active') }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleActiveSelected('A')">
                  {{ $t('actions.activate') }}
                </el-dropdown-item>
                <el-dropdown-item @click="handleActiveSelected('D')">
                  {{ $t('actions.inactivate') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button id="UserList__AssignUserGroup" type="primary" @click="handleGroupSelected()"> {{ $t('userManage.group') }}aa </el-button>
        </div>
      </header>
      <header v-show="state.selectList.length === 0" class="header-flex">
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          @form-change="handleFilterFormChange"
          inputKey="userNameOrEmail"
          :inputPlaceHolder="$t('placeHolder.userNameOrEmail')"
        />
        <el-button
          id="UserList__CreateNewUser"
          class="el-icon--right"
          type="primary"
          :disabled="state.activeUsers >= state.licenseUsers"
          @click="handleUserDialogShow()"
        >
          {{ $t('user_newUser') }} ({{ state.activeUsers }} / {{ state.licenseUsers }})
        </el-button>
      </header>
    </template>
    <template #group="{ row }">
      <div class="groups-cell">
        <el-tag v-for="item in row.groups" :key="item.id || item.name" class="el-icon--left table-tag" v-tooltip="item.name">
          {{ item.name }}
        </el-tag>
      </div>
    </template>
    <template #status="{ row }">
      <el-switch
        v-model="row.status"
        :inactive-text="t('actions.inactive')"
        :active-text="t('user_active')"
        active-value="A"
        inactive-value="D"
        :loading="row.loading"
        :disabled="row.status === 'D' && state.activeUsers >= state.licenseUsers"
        @change="(value: 'A' | 'D') => handleSetStatus(value, row)"
      />
    </template>
  </VxeGrid>

  <UserDialog ref="UserDialogRef" @refresh="handleUserCreated" />
  <UserAddGroupDialog ref="UserAddGroupDialogRef" @refresh="reload()" />
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { fetchUsersPage, batchActiveUsers, batchDeleteUsers, fetchLicenseUserCount, openUserDetail, sendInvitation, unlockUser, fetchGroupList } = useAdminUser()

const filterParams = ref<Record<string, any>>({})

type TableState = {
  activeUsers: number
  licenseUsers: number
  selectList: any[]
}
const state = reactive<TableState>({
  activeUsers: 10,
  licenseUsers: 50,
  selectList: []
})

const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-user-table',
  api: async (pageParams: any) => {
    cleanSelectedRows()
    return {
      data: await fetchUsersPage({
        ...pageParams,
        ...filterParams.value
      })
    }
  },
  columns: [
    { field: 'username', title: 'user_username', fixed: 'left', type: 'checkbox' },
    { field: 'email', title: 'user_email' },
    { field: 'role.roleName', title: 'user_role' },
    {
      field: 'groups',
      title: 'user_groups',
      slots: { default: 'group' },
      showOverflow: false
    },
    { field: 'userLevel', title: 'user_level' },
    {
      field: 'status',
      title: 'user_status',
      slots: { default: 'status' }
    },
    {
      field: 'registered',
      title: 'user_registered',
      formatter: ({ row }: any) => {
        return row.registered ? 'Registered' : 'Pending'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit_user',
        name: 'Edit User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => openUserDetail(row)
      },
      {
        code: 'sendInvitation',
        name: 'Send Invitation',
        action: ({ row }: any) => {
          sendInvitation(row)
        }
      },
      {
        code: 'delete_user',
        name: 'Delete User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => handleDelete([row])
      },
      {
        code: 'unlock_user',
        name: 'Unlock User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => handleUnlock(row)
      }
    ]
  ],
  permissionMethod: ({ row, code }) => {
    if (code === 'sendInvitation') {
      return {
        visible: !row.registered,
        disabled: false
      }
    }
    return { visible: true, disabled: false }
  },
  optionalConfig: {
    rowConfig: {
      height: 60,
      isCurrent: true,
      isHover: true
    },
    tooltipConfig: {
      contentMethod: ({ row, column }: any) => {
        const key = column.property
        if (!key || !row) return ''
        const value = row[key] ?? ''
        if (key === 'groups' || key === 'groupDTOList') {
          return Array.isArray(value) ? value.map((item: any) => item.name).join(', ') : value
        }
        if (typeof value === 'string') return value
        if (Array.isArray(value)) return value.join(',')
      }
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectList = [...selectedRows]
  },
  dblClickAction: ({ row }: any) => openUserDetail(row)
})

const ResponsiveFilterRef = ref()
const UserDialogRef = ref()
const UserAddGroupDialogRef = ref()

function handleUserDialogShow() {
  UserDialogRef.value.handleOpen()
}

async function handleUserCreated() {
  await refreshLicenseCount()
  reload()
}

function handleFilterFormChange(formModel: any) {
  if (formModel.isDesc === undefined) formModel.isDesc = true
  filterParams.value = { ...formModel }
  reload()
}
async function handleUnlock(row: any) {
  if (!row?.userId) return
  try {
    const res = await unlockUser(row.userId).then((r) => r.data)
    if (res) {
      routerProvider?.message.success(t('commons_success'))
    }
  } catch (error) {
    console.log(error)
  }
}
async function handleDelete(rows?: any[]) {
  const targets = rows?.length ? rows : state.selectList
  const userIds = targets.map((item: any) => item.userId).filter(Boolean)
  if (!userIds.length) return
  try {
    const action = await ElMessageBox.confirm(t('userTip.confirmWhetherToDeleteItems'), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: `${t('common_confirmDelete')}`,
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const res = await batchDeleteUsers({ userIds })
    console.log(res)
    if (!!res) {
      routerProvider?.message.success(t('userTip.userSelectedDeleteMsg'))
      reload()
    }
  } catch (error) {
    console.log(error)
  }
}

async function handleSetStatus(status: 'A' | 'D', row: any) {
  if (status === row.value || !row.userId || status === null) return
  if (state.activeUsers >= state.licenseUsers && status === 'A') {
    row.status = 'D'
    routerProvider?.message.warning(t('user_activeUserOverLimit'))
    return
  }
  try {
    row.loading = true
    await batchActiveUsers({
      userIds: [row.userId],
      status
    })
    await refreshLicenseCount()
  } catch (error) {
    row.status = row.status === 'A' ? 'D' : 'A'
  } finally {
    row.loading = false
  }
}

async function refreshLicenseCount() {
  const data = await fetchLicenseUserCount()
  state.activeUsers = data?.totalActive || 0
  state.licenseUsers = data?.licenseUserNum || 0
}

async function handleActiveSelected(status: 'A' | 'D') {
  const noActiveUsersCount = state.selectList.filter((item: any) => item.status === 'D').length
  if (state.activeUsers + noActiveUsersCount > state.licenseUsers && status === 'A') {
    routerProvider?.message.warning(t('user_activeUserOverLimit'))
    return
  }
  try {
    await batchActiveUsers({
      userIds: state.selectList.map((item: any) => item.userId),
      status
    })
    routerProvider?.message.success(status === 'A' ? t('user.activate.successfully.msg') : t('user.inactivate.successfully.msg'))
    await refreshLicenseCount()
    reload()
  } catch (error) {
    console.log(error)
  }
}

function handleGroupSelected() {
  UserAddGroupDialogRef.value.handleOpen(
    [],
    state.selectList.map((item: any) => item.userId)
  )
}
async function initFilter() {
  const conditions = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'user_email', value: 'email' },
        { label: 'user_level', value: 'userLevel' },
        { label: 'common_status', value: 'status' },
        { label: 'user_registered', value: 'registered' },
        { label: 'user_username', value: 'username' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'boolean',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    },
    {
      key: 'status',
      label: 'Active',
      type: 'string',
      options: [
        {
          value: 'A',
          label: 'isActive'
        },
        {
          value: 'D',
          label: 'noActive'
        }
      ],
      isMultiple: false
    },
    {
      key: 'registered',
      label: 'Registered',
      type: 'boolean',
      options: [
        {
          value: true,
          label: 'Registered'
        },
        {
          value: false,
          label: 'Pending'
        }
      ],
      isMultiple: false
    },
    {
      key: 'userLevel',
      label: 'User Level',
      type: 'string',
      options: [
        {
          value: 'Premium',
          label: 'Premium'
        },
        {
          value: 'Standard',
          label: 'Standard'
        },
        {
          value: 'Essential',
          label: 'Essential'
        }
      ],
      isMultiple: false
    }
  ]
  const groups = await fetchGroupList()
  conditions.push({
    key: 'groups',
    label: 'Groups',
    type: 'string',
    options: groups,
    isMultiple: true
  })
  ResponsiveFilterRef.value.init(conditions)
}
onMounted(() => {
  initFilter()
  refreshLicenseCount()
  state.selectList = []
})
</script>

<style lang="scss" scoped>
:deep(.headerLeftExpand .el-form-item--default) {
  margin-bottom: 0;
}

:deep(.responsive-container .el-input) {
  width: 250px;
}

.groups-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
}

.table-tag {
  max-width: 100%;
  overflow: hidden;

  :deep(.el-tag__content) {
    display: inline-block;
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
}

:deep(.headerLeftExpand) {
  .el-input {
    width: 200px;
  }
}

.header-flex {
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
}

.title-select {
  display: flex;
  align-items: center;
  --icon-size: 1.2rem;
}

:deep(.tableHeader) {
  gap: unset;
}

.el-divider--vertical {
  height: 1.5rem;
}

:deep(.el-input) {
  width: 200px;
}

.flex-x-end {
  display: flex;
  justify-content: end;
}
</style>
