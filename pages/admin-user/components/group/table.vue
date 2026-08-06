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
  <GroupDialog ref="GroupDialogRef" :groups="currentGroups" @refresh="reload" />
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { fetchGroupsPage, deleteGroup, openGroupDetail } = useAdminGroup()

const currentGroups = ref<any[]>([])
const filterParams = ref<Record<string, any>>({})
const { t } = useI18n()

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'a-groupTable',
  api: async (pageParams: any) => {
    const { pageNum = 0, pageSize, orderBy, isDesc } = pageParams
    const data = await fetchGroupsPage({
      page: pageNum + 1,
      pageSize,
      orderBy,
      isDesc,
      ...(filterParams.value.userNameOrEmail
        ? { groupName: filterParams.value.userNameOrEmail }
        : {})
    })
    currentGroups.value = data?.list ?? []
    return {
      data: {
        entryList: currentGroups.value,
        totalSize: data?.total ?? 0
      }
    }
  },
  columns: [
    { field: 'groupName', title: 'user_userGroupName', fixed: 'left' },
    { field: 'groupId', title: 'user_userGroupIdentifer' }
  ],
  dblClickAction: ({ row }: any) => {
    openGroupDetail(row)
  },
  bodyActions: [
    [
      {
        code: 'edit_group',
        name: 'common_edit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          openGroupDetail(row)
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
  permissionMethod: ({ row, code }: any) => {
    if (code === 'delete_group') {
      const groupId = row.groupId ?? row.id
      return {
        visible: groupId !== 'members' && groupId !== 'administrators',
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

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('user_userGroupDeletedMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      dangerouslyUseHTMLString: true
    })
    if (action !== 'confirm') return
    const res = await deleteGroup(row.groupId ?? row.id)
    if (!!res) {
      routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('dataField.type.group') }))
      reload()
    }
  } catch (error) {
    console.log(error)
  }
}

const ResponsiveFilterRef = ref()

function handleFilterFormChange(formModel: any) {
  filterParams.value = { ...formModel }
  reload()
}

const GroupDialogRef = ref()

function handleGroupDialogShow() {
  GroupDialogRef.value.handleOpen()
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
