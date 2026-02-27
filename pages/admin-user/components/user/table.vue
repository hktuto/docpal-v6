<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <header v-show="state.selectList?.length > 0" class="header-flex">
        <div class="title-select color__primary">
          <b class="el-icon--left"> {{ $t('notifications.userSelected') }}: {{ state.selectList.length }} </b>
          <Icon id="UserList__ClearSelected" name="ic:baseline-clear" class="normal cursor-pointer" @click="cleanSelectedRows"></Icon>
        </div>
        <div class="flex-x-end">
          <el-button id="UserList__Delete"  type="danger" @click="handleDeleteSelected()">
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
          >{{ $t('user_newUser') }} ({{ state.activeUsers }} / {{ state.licenseUsers }})
        </el-button>
      </header>
    </template>
    <template #group="{ row, index }">
      <el-tag class="el-icon--left table-tag" v-for="item in row.groupDTOList">
        {{ item.name }}
      </el-tag>
    </template>
    <template #status="{ row, index }">
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

  <UserDialog ref="UserDialogRef" @refresh="reload"></UserDialog>
  <UserAddGroupsDialog ref="UserAddGroupDialogRef" @refresh="reload()"></UserAddGroupsDialog>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { userProviderKey } from '~/util/userProvider'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['filter-change', 'refresh'])
const userProvider = inject(userProviderKey)

const props = defineProps(['condition'])

type TableState = {
  ready: boolean
  loading: boolean
  activeUsers: number
  licenseUsers: number
  extraParams: any
  extraParamsFilter: any
  selectList: any[]
}
const state = reactive<TableState>({
  ready: false,
  loading: false,
  activeUsers: 10,
  licenseUsers: 50,
  extraParams: {},
  extraParamsFilter: {},
  selectList: []
})

const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-user-table',
  api: async (pageParams: any) => {
    cleanSelectedRows()
    return await userProvider?.getAllUsersApi(pageParams)
  },
  columns: [
    { field: 'username', title: 'user_username', fixed: 'left', type: 'checkbox' },
    { field: 'email', title: 'user_email' },
    {
      field: 'role.roleName',
      title: 'user_role'
    },
    {
      field: 'groupDTOList',
      title: 'user_groups',
      slots: {
        default: 'group'
      }
    },
    {
      field: 'userLevel',
      title: 'user_level'
    },
    {
      field: 'status',
      title: 'user_status',
      slots: {
        default: 'status'
      }
    },
    {
      field: 'registered',
      title: 'user_registered'
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit_user',
        name: 'Edit User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          userProvider?.openUserDetail(row)
        }
      },
      {
        code: 'sendInvitation',
        name: 'Send Invitation',
        action: ({ row }: any) => {
          if (row.registered === 'Pending') {
            userProvider?.sendInvitation(row)
          }
        }
      },
      {
        code: 'delete_user',
        name: 'Delete User',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
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
    return {
      visible: true,
      disabled: false
    }
  },
  optionalConfig: {
    rowConfig: {
      height: 60,
      isCurrent: true,
      isHover: true
    },
    tooltipConfig: {
      contentMethod: ({ items, row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, type, cell, $event }: any) => {
        const key = column.property
        if (!key || !row) return ''
        const value = row[key] ?? ''
        if (key === 'groupDTOList') {
          if (Array.isArray(value)) {
            return value.map((item: any) => item.name).join(', ')
          }
          return value
        }
        if (typeof value === 'string') {
          return value
        }
        if (Array.isArray(value)) {
          return value.join(',')
        }
      }
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectList = [...selectedRows]
  },
  dblClickAction: ({ row, column, event }: any) => {
    userProvider?.openUserDetail(row)
  }
})

// #endregion
// #region module:

// #endregion
const UserDialogRef = ref()

function handleUserDialogShow() {
  UserDialogRef.value.handleOpen()
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(t('userTip.confirmWhetherToDeleteItems'), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: `${t('common_confirmDelete')}`,
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const params = {
      userIds: state.selectList.map((item: any) => item.userId)
    }
    await userProvider?.BatchDeleteUserApi(params)
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
    const res = await userProvider?.BatchDeleteUserApi({ userIds: [row.userId] })
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
    await userProvider?.SetUserStatusApi(row)
    await getAllUserAndActiveCount()
  } catch (error) {
    row.status = row.status = 'A' ? 'D' : 'A'
  } finally {
    row.loading = false
  }
}

async function getAllUserAndActiveCount() {
  const { ActiveCount, licenseUserNum } = await userProvider?.getAllUserAndActiveCountApi()
  state.activeUsers = ActiveCount || 0
  state.licenseUsers = licenseUserNum || 0
}

// #region module:select actions

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
  const result = await userProvider?.BatchActiveUserApi(params)
  if (result.length > 0) {
    routerProvider?.message.error(
      t('userTip.operationFailed', {
        users: result.join(',')
      })
    )
  } else {
    if (status === 'A') {
      routerProvider?.message.success(t('user.activate.successfully.msg'))
    } else {
      routerProvider?.message.success(t('user.inactivate.successfully.msg'))
    }
  }
  getAllUserAndActiveCount()
  reload()
}

const UserAddGroupDialogRef = ref()

function handleGroupSelected() {
  const params = {
    ids: state.selectList.map((item: any) => item.id),
    userIds: state.selectList.map((item: any) => item.userId)
  }
  UserAddGroupDialogRef.value.handleOpen([], params)
}

// #endregion
// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function getFilter(conditions: any, initParams: any) {
  conditions.forEach((condition: any) => {
    if (condition.options) {
      condition.options.sort((a: any, b: any) => a.value.localeCompare(b.value))
    }
  })
  conditions.unshift(
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
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    }
  )
  ResponsiveFilterRef.value.init(conditions, initParams)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  state.extraParamsFilter = formModel
  emits('filter-change', state.extraParamsFilter)
}

function handleClearFilter() {
  state.extraParamsFilter = {}
  emits('filter-change', state.extraParamsFilter)
}

// #endregion

onMounted(() => {
  getAllUserAndActiveCount()
  state.selectList = []
})

defineExpose({ reload, getFilter })
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
  // background: var(--el-color-primary-light-9);
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
