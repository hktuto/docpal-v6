<template>
  <el-card>
    <template #header>
      <div v-show="state.selectedRows.length > 0" class="flex-x-between">
        <div class="title-select color__primary flex-x-start">
          <b class="el-icon--left"> {{ $t('notifications.userSelectedByUserGroup') }}: {{ state.selectedRows.length }} </b>
          <SvgIcon id="UserGroupList__Info__ClearSelected" :src="'/icons/close.svg'" :content="$t('button.clearSelected')" @click="cleanSelectedRows" />
        </div>
        <el-button id="UserGroupList__Info__RemoveUser" type="danger" @click="handleDeleteSelected()">
          {{ $t('Remove User') }}
        </el-button>
      </div>
      <div v-show="state.selectedRows.length === 0" class="flex-x-between">
        <span>{{ $t('user_users') }}</span>
        <!-- v-show="group && group.isCanModified" -->
        <el-button id="UserGroupList__Info__AddUsersToUserGroup" class="button" type="primary" @click="handleGroupAddMemberFormShow()">
          {{ $t('user_addUsersToUserGroup') }}
        </el-button>
      </div>
    </template>
    <div style="height: 100%; overflow: hidden; position: relative">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="username" />
        </template>
      </VxeGrid>
    </div>
    <GroupAddUserDialog ref="UserAddGroupDialogRef" :group="group" @refresh="getMemberGroupList"></GroupAddUserDialog>
  </el-card>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import type { GroupDTO, UserDTO } from 'api/src/generate/admin'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const { fetchGroupMembers, removeUsersFromGroup } = useAdminGroup()
const props = defineProps<{
  group: GroupDTO
}>()
const state = reactive<any>({
  selectedRows: [],
  userList: []
})
const ResponsiveFilterRef = ref()
const { tableConfig, tableEvent, tableRef, cleanSelectedRows } = useVxeTable({
  id: 'a-userTableSetting',
  api: () => {
    ResponsiveFilterRef.value.handleFilter()
    return getMemberGroupList()
  },
  columns: [
    { field: 'userName', title: 'user_username', fixed: 'left', type: 'checkbox' },
    { field: 'userId', title: 'user_groupIdentifer' }
  ],
  bodyActions: [
    [
      {
        code: 'delete_user',
        name: 'common_remove',
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
  optionalConfig: {},
  virtualScroll: true
})

const UserAddGroupDialogRef = ref()

function handleFilterFormChange(formModel: any) {
  let data = state.userList
  if (formModel.username) {
    data = state.userList.filter((item: any) => item.firstName.toLowerCase().includes(formModel.username.toLowerCase()))
  }
  tableRef.value?.loadData(data)
}

function handleGroupAddMemberFormShow() {
  UserAddGroupDialogRef.value.handleOpen(state.userList)
}

async function getMemberGroupList() {
  setTimeout(async () => {
    const data = await fetchGroupMembers({
      groupId: props.group.id,
      page: 1,
      pageSize: 100
    })
    state.userList = data?.list ?? []
    state.selectedRows = []
    tableRef.value?.loadData(state.userList)
  })
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(`${t('user_userGroupSelectDeletedSuccessMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmRemove'),
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const ids = state.selectedRows.map((item: any) => item.userId)

    await removeUsersFromGroup({
      groupId: props.group.id,
      userIds: ids
    })
    routerProvider?.message.success(t('user_userGroupSelectRemovedSuccessMsg'))
    getMemberGroupList()
    state.selectedRows = []
  } catch (error) {
    console.log(error)
  }
}

async function handleDelete(row: UserDTO) {
  try {
    const action = await ElMessageBox.confirm(`${t('user_userGroupRemoveMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmRemove'),
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    await removeUsersFromGroup({
      userIds: [row.userId],
      groupId: props.group.id
    })
    routerProvider?.message.success(t('user_userGroupRemovedSuccessMsg'))
    getMemberGroupList()
  } catch (error) {
    console.log(error)
  }
}

</script>

<style lang="scss" scoped>
.el-card {
  display: grid;
  grid-template-rows: min-content 1fr;
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
}

.flex-x-start {
  display: flex;
  justify-content: flex-start;
}

:deep(.el-input) {
  width: 200px;
}
</style>
