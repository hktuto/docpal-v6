<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <header v-show="state.selectList?.length > 0" class="header-flex">
        <div class="title-select color__primary">
          <b class="el-icon--left"> {{ $t('notifications.userSelected') }}: {{ state.selectList.length }} </b>
          <Icon id="UserList__ClearSelected" name="ic:baseline-clear" class="normal cursor-pointer" @click="cleanSelectedRows"></Icon>
        </div>
        <div class="flex-x-end">
          <el-button id="UserList__Delete" type="danger" @click="handleDeleteSelected()">
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
          <el-button id="UserList__AssignUserGroup" type="primary" @click="handleGroupSelected()">
            {{ $t('userManage.group') }}
          </el-button>
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
      <el-tag class="el-icon--left table-tag" v-for="item in row.groupDTOList" :key="item.id || item.name">
        {{ item.name }}
      </el-tag>
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

  <UserDialog ref="UserDialogRef" @refresh="reload" />
  <UserAddGroupsDialog ref="UserAddGroupDialogRef" @refresh="reload()" />
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const { t } = useI18n()
const { fetchUsersPage, setUserStatus, batchActiveUsers, batchDeleteUsers, fetchLicenseUserCount, openUserDetail, sendInvitation } = useAdminUser()

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
      field: 'groupDTOList',
      title: 'user_groups',
      slots: { default: 'group' }
    },
    { field: 'userLevel', title: 'user_level' },
    {
      field: 'status',
      title: 'user_status',
      slots: { default: 'status' }
    },
    { field: 'registered', title: 'user_registered' }
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
          if (row.registered === 'Pending') sendInvitation(row)
        }
      },
      {
        code: 'delete_user',
        name: 'Delete User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => handleDelete(row)
      }
    ]
  ],
  permissionMethod: ({ row, code }) => {
    if (code === 'sendInvitation') {
      return {
        visible: row.registered === 'Pending',
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
        if (key === 'groupDTOList') {
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

const UserDialogRef = ref()
const UserAddGroupDialogRef = ref()

function handleUserDialogShow() {
  UserDialogRef.value.handleOpen()
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  filterParams.value = { ...formModel }
  reload()
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(t('userTip.confirmWhetherToDeleteItems'), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: `${t('common_confirmDelete')}`,
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    await batchDeleteUsers({
      userIds: state.selectList.map((item: any) => item.userId)
    })
    routerProvider?.message.success(t('userTip.userSelectedDeleteMsg'))
    reload()
  } catch (error) {
    console.log(error)
  }
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('userTip.confirmWhetherToDeleteItems'), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: `${t('common_confirmDelete')}`,
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const res = await batchDeleteUsers({ userIds: [row.userId] })
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
    await setUserStatus(row)
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
  const params = {
    ids: state.selectList.map((item: any) => item.id),
    userIds: state.selectList.map((item: any) => item.userId),
    active: status
  }
  const result: any = await batchActiveUsers(params)
  if (result?.length > 0) {
    routerProvider?.message.error(
      t('userTip.operationFailed', {
        users: result.join(',')
      })
    )
  } else if (status === 'A') {
    routerProvider?.message.success(t('user.activate.successfully.msg'))
  } else {
    routerProvider?.message.success(t('user.inactivate.successfully.msg'))
  }
  await refreshLicenseCount()
  reload()
}

function handleGroupSelected() {
  UserAddGroupDialogRef.value.handleOpen([], {
    ids: state.selectList.map((item: any) => item.id),
    userIds: state.selectList.map((item: any) => item.userId)
  })
}

onMounted(() => {
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

.table-tag {
  margin-bottom: 5px;
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
