<template>
  <el-card>
    <template #header>
      <div v-show="state.selectedRows.length > 0" class="flex-x-between">
        <div class="title-select color__primary flex-x-start">
          <b class="el-icon--left"> {{ $t('user_userGroup_selectedMsg') }}: {{ state.selectedRows.length }} </b>
          <SvgIcon :src="'/icons/close.svg'" :content="$t('button.clearSelected')" @click="cleanSelectedRows" />
        </div>
        <el-button id="UserList__Info__Delete" type="danger" @click="handleDeleteSelected()">
          {{ $t('common_delete') }}
        </el-button>
      </div>
      <div v-show="state.selectedRows.length === 0" class="flex-x-between">
        <span
          ><h3>{{ $t('user_userGroupAssignment') }}</h3></span
        >
        <el-button id="UserList__Info__AssignUserGroup" class="button" type="primary" @click="handleAddGroup()">
          {{ $t('user_addGroups') }}
        </el-button>
      </div>
    </template>
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <slot name="toolbar_buttons" />
        <ResponsiveFilter ref="ResponsiveFilterRef" inputPlaceHolder="placeHolder.userGroupName" @form-change="handleFilterFormChange" inputKey="q" />
      </template>
      <template #more="{ row }">
        <Icon v-if="!noDeleteList.includes(row.groupId ?? row.id)" name="material-symbols:delete-rounded" class="normal cursor-pointer" @click="handleDelete(row)"></Icon>
      </template>
    </VxeGrid>
    <UserAddGroupDialog ref="UserAddGroupDialogRef" :user="user" @refresh="reload"></UserAddGroupDialog>
  </el-card>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { fetchUserGroups, batchUserRemoveGroups } = useAdminUser()
const props = defineProps<{
  user: any
}>()
const state = reactive<any>({
  selectedRows: [],
  groupList: []
})
let tableData: any[] = []
let isFilter = false
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, cleanSelectedRows, reload } = useVxeTable({
  id: 'a-user-group',
  api: async (params: any) => {
    const data = await getMemberGroupList()
    return data
  },
  columns: [
    { field: 'groupName', title: 'user_userGroupName', fixed: 'left', type: 'checkbox' },
    { field: 'groupId', title: 'user_userGroupIdentifer' }
  ],
  selectChangeHander: (selectedRows: any[]) => {
    state.selectedRows = [...selectedRows]
  },
  virtualScroll: true
})

const noDeleteList = ['members']
const UserAddGroupDialogRef = ref()

function handleAddGroup() {
  UserAddGroupDialogRef.value.handleOpen(tableData)
}

async function getMemberGroupList() {
  if (!isFilter) {
    tableData = (await fetchUserGroups(props.user.userId)) as any[]
  }
  let filterData = JSON.parse(JSON.stringify(tableData))
  if (!!extraParams.q) {
    filterData = filterData.filter((item: any) => {
      const name = (item.groupName ?? item.name ?? '').toLowerCase()
      return name.includes(extraParams.q.toLowerCase())
    })
  }
  isFilter = false
  return filterData
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('groupTip.confirmWhetherToDeleteItem')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: `${t('common_confirmDelete')}`
    })
    if (action !== 'confirm') return
    await batchUserRemoveGroups({
      groupIds: [row.groupId ?? row.id],
      userId: props.user.userId
    })
    reload()
  } catch (error) {
    console.log(error)
  }
}

async function handleDeleteSelected() {
  try {
    const action = await ElMessageBox.confirm(t('groupTip.confirmWhetherToDeleteItems', { username: props.user.firstName }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmRemove')
    })
    if (action !== 'confirm') return
    const ids = state.selectedRows
      .filter((item: any) => !noDeleteList.includes(item.groupId ?? item.id))
      .map((item: any) => item.groupId ?? item.id)
    if (ids.length === 0) {
      routerProvider?.message.warning(t('userTip.noValidGroups', { groupIds: noDeleteList.join(',') }))
      return
    }
    await batchUserRemoveGroups({
      groupIds: ids,
      userId: props.user.userId
    })
    state.selectedRows = []
    routerProvider?.message.success(t('user_removeGroupsSuccessMsg', { username: props.user.firstName }))
    reload()
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  isFilter = true
  extraParams = formModel
  reload()
}

onMounted(() => {
  state.selectedRows = []
})
</script>

<style lang="scss" scoped>
.el-card {
  display: grid;
  grid-template-rows: min-content 1fr;
}

:deep(.el-input) {
  width: 200px;
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
}
</style>
