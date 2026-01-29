<template>
  <div class="user-table">
    <div class="user-table-header">
      <h4>{{ $t('orgChart.userTable.title') }}</h4>
      <div class="header-actions">
      </div>
    </div>
    <VxeGrid
      ref="tableRef"
      v-bind="tableConfig"
      v-on="tableEvent"
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
    >
      <template #toolbar_buttons>
        <div class="tableActions">

          <el-button type="primary" @click="showAddUserDialog = true">
            {{ $t('orgChart.userTable.addUserButton') }}
          </el-button>
          <el-button
            v-if="selectedUsers.length"
            type="danger"
            @click="handleBatchDelete"
          >
            {{ $t('common_delete') }}
          </el-button>
        </div>
      </template>
    </VxeGrid>

    <AddUserDialog
      v-model="showAddUserDialog"
      :roleId="roleId"
      :type="type"
      @confirm="handleAddUsers"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { clientApi } from 'api'
import AddUserDialog from './AddUserDialog.vue'
import { ElMessageBox, ElNotification } from 'element-plus'

const { t } = useI18n()

const props = defineProps<{
  roleId: string
  isAdd: boolean
  type: number
}>()

const showAddUserDialog = ref(false)
const selectedUsers = ref<any[]>([])
const emit = defineEmits<{
  (e: 'update', users: any[]): void
}>()

const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'role-users',
  api: async (pageParams: any) => {
    const conditions = [
      {
        column: 'acRoleId',
        type: 'EQ',
        values: props.roleId
      }
    ]
    const data = await clientApi.admin.postAdmindocpalAclRoleUsersPage({
      ...pageParams,
      conditions
    })
    return data
  },
  virtualScroll: props.isAdd,
  columns: [
    { type: 'checkbox', width: '30px', fixed: 'left' },
    { field: 'userName', title: t('orgChart.userTable.columns.username'), width: 120 },
    {
      field: 'email',
      title: t('orgChart.userTable.columns.email')
    }
  ],
  bodyActions: [
    [
      {
        code: 'remove_user',
        name: t('orgChart.userTable.actions.remove'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleRemoveUser(row)
        }
      }
    ]
  ]
})

function handleCheckboxChange({ records }: { records: any[] }) {
  selectedUsers.value = records
}

function handleCheckboxAll({ records }: { records: any[] }) {
  selectedUsers.value = records
}

async function handleBatchDelete() {
  if (!selectedUsers.value.length) return

  try {
    const action = await ElMessageBox.confirm(
      t('common_confirmDelete'),
      t('dpTip_warning'),
      {
        confirmButtonText: t('dpButtom_confirm'),
        cancelButtonText: t('dpButtom_cancel'),
        type: 'warning'
      }
    )
    if (action !== 'confirm') return

    const userIds = selectedUsers.value.map(user => user.id)
    await clientApi.admin.deleteAdmindocpalAclRoleUsers(userIds)
    selectedUsers.value = []
    emit('update', [])
    reload()
    ElNotification({
      title: t('commons_success'),
      message: t('common_deleteSuccess'),
      type: 'success'
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete users:', error)
      ElNotification({
        title: t('commons_error'),
        message: t('common_deleteFail'),
        type: 'error'
      })
    }
  }
}

async function handleAddUsers(userIds: string[]) {
  try {
    await clientApi.admin.postAdmindocpalAclRoleUsers({
      roleId: props.roleId,
      userIds
    })
    reload()
    ElNotification({
      title: t('commons_success'),
      message: t('common_addSuccess'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to add users to role:', error)
    ElNotification({
      title: t('commons_error'),
      message: t('common_addFail'),
      type: 'error'
    })
  }
}

const handleRemoveUser = async (user: any) => {
  try {
    const action = await ElMessageBox.confirm(
      t('common_confirmDelete'),
      t('dpTip_warning'),
      {
        confirmButtonText: t('dpButtom_confirm'),
        cancelButtonText: t('dpButtom_cancel'),
        type: 'warning'
      }
    )
    if (action !== 'confirm') return

    await clientApi.admin.deleteAdmindocpalAclRoleUsers([user.id])
    emit('update', [])
    reload()
    ElNotification({
      title: t('commons_success'),
      message: t('common_deleteSuccess'),
      type: 'success'
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to remove user from role:', error)
      ElNotification({
        title: t('commons_error'),
        message: t('common_deleteFail'),
        type: 'error'
      })
    }
  }
}
</script>

<style scoped>
.user-table {
  margin-top: 2rem;
  height: 600px;
}

.user-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.user-table-header h4 {
  margin: 0;
}
</style> 
