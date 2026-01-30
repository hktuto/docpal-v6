<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter
        ref="ResponsiveFilterRef"
        @form-change="handleFilterFormChange"
        inputKey="userNameOrEmail"
        :inputPlaceHolder="$t('placeHolder.userGroupName')"
      />
      <el-button id="UserGroupList__AddNewUserGroup" class="el-icon--right button" type="primary" @click="handleGroupDialogShow()">
        {{ $t('user_newGroup') }}
      </el-button>
    </template>
  </VxeGrid>
  <GroupDialog ref="GroupDialogRef" :groups="state._groupList" @refresh="getGroup"></GroupDialog>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { groupProviderKey } from '~/util/userProvider'

const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['filter-change', 'refresh'])
const groupProvider = inject(groupProviderKey)

type State = {
  groupList: any
  _groupList: any[]
}
const state = reactive<State>({
  groupList: [],
  _groupList: []
})
let filterParams: any = {}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  api: (pageParams: any) => {
    ResponsiveFilterRef.value.handleFilter()
    return getGroup()
  },
  id: 'a-groupTable',
  columns: [
    { field: 'name', title: 'user_userGroupName', fixed: 'left' },
    { field: 'id', title: 'user_userGroupIdentifer' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    groupProvider?.openGroupDetail(row)
  },
  bodyActions: [
    [
      {
        code: 'edit_group',
        name: 'common_edit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          groupProvider?.openGroupDetail(row)
        }
      },
      {
        code: 'delete_group',
        name: 'common_delete',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      }
    ]
  ],
  virtualScroll: true,
  permissionMethod: ({ row, code }: any) => {
    if (code === 'delete_group') {
      return {
        visible: row.id !== 'members' && row.id !== 'administrators',
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  optionalConfig: {}
})

// #endregion
const UserDialogRef = ref()

function handleUserDialogShow() {
  UserDialogRef.value.handleOpen()
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('user_userGroupDeletedMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const res = await groupProvider?.DeleteGroupApi({ groupId: row.id })
    if (!!res) {
      routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('dataField.type.group') }))
      await getGroup()
    }
  } catch (error) {
    console.log(error)
  }
}

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

function handleFilterFormChange(formModel: any) {
  filterParams = formModel
  if (formModel.userNameOrEmail) {
    state._groupList = state.groupList.filter((item: any) => {
      return item.name.toLowerCase().includes(formModel.userNameOrEmail.toLowerCase())
    })
  } else {
    state._groupList = [...state.groupList]
  }
  tableRef.value?.loadData(state._groupList)
}

// #endregion
async function getGroup() {
  tableConfig.loading = true
  state.groupList = await groupProvider?.GetGroupListApi()
  handleFilterFormChange(filterParams)
  tableConfig.loading = false
  return state.groupList
}

const GroupDialogRef = ref()

function handleGroupDialogShow() {
  GroupDialogRef.value.handleOpen()
}

function refresh() {
  getGroup()
}

defineExpose({ reload })
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

:deep(.vxe-buttons--wrapper) {
  justify-content: space-between;

  .responsive-container {
    width: 70%;
  }
}
</style>
