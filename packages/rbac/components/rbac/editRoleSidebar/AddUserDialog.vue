<template>
  <el-dialog
    v-model="dialogVisible"
    :title="type === 1 ? $t('orgChart.userTable.addUserToRole') : $t('orgChart.userTable.addUserToGroup')"
    width="500px"
    @close="handleClose"
  >
    <div v-loading="loading" class="dialog-content">
      <el-select-v2
        v-model="selectedUsers"
        :options="users"
        :placeholder="type === 1 ? $t('orgChart.userTable.addUserToRole') : $t('orgChart.userTable.addUserToGroup')"
        filterable
        multiple
        class="filter-input"
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ $t('dpButtom_cancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedUsers.length" @click="handleConfirm">
          {{ $t('dpButtom_confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { newAdminApi } from 'api'
import { ElNotification } from 'element-plus'

interface UserOption {
  label: string
  value: string
}

const props = defineProps<{
  modelValue: boolean
  roleId: string
  type: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', userIds: string[]): void
}>()

const { t } = useI18n()
const dialogVisible = ref(props.modelValue)
const selectedUsers = ref<string[]>([])
const users = ref<UserOption[]>([])

watch(() => props.modelValue, async (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    await loadUsers()
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})
const loading = ref(false)
const loadUsers = async () => {
  try {
    loading.value = true
    // type 1 = role
    // type 2 = group
    // need to check type if type is 1 , use role user dropdown 
    let allUsers = []
    if (props.type === 1) {
      const response = await newAdminApi.getDocpalAclRoleUsersDropdown({
        params: {
          roleId: props.roleId
        }
      } as any).then((res) => res.data)
      if (!response) {
        throw new Error(t('common.invalidResponseFormat'))
      }
      allUsers = response.map((item) => ({
        label: item.username || '',
        value: item.userId || ''
      }))
    } else if (props.type === 2) {
      const groupUserResponse = await newAdminApi.postUcenterUsers({}).then((res) => res.data)
      if (!groupUserResponse) {
        throw new Error(t('common.invalidResponseFormat'))
      }
      allUsers = groupUserResponse.map((item) => ({
        label: item.username || '',
        value: item.userId || ''
      }))
    }
    users.value = allUsers

  } catch (error) {
    console.error(t('rbac.role.fetchUsersError'), error)
    ElNotification({
      title: t('commons_error'),
      message: t('common_fetchFail'),
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  selectedUsers.value = []
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('confirm', selectedUsers.value)
  handleClose()
}
</script>

<style scoped>
.dialog-content {
  padding: 20px 0;
}

.filter-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 
