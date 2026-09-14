<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'

type MenuItemPermissionLevel = 'View' | 'Edit' | 'Manage'

interface UserOption {
  id: string
  username?: string
  name?: string
}

interface PermissionFormData {
  targetType: number
  targetId: string
  permissionLevel: MenuItemPermissionLevel
}

const props = defineProps<{
  existList: { targetType: number; targetId: string; isInherit?: boolean }[]
}>()

function isExistingTarget(targetType: number, targetId: string): boolean {
  return props.existList.some(
    (item) => item.targetType === targetType && item.targetId === targetId && item.isInherit === false
  )
}

const emit = defineEmits<{
  submit: [data: PermissionFormData]
}>()

const dialogVisible = ref(false)
const submitting = ref(false)
const usersLoading = ref(false)

const users = ref<UserOption[]>([])
const selectedUserId = ref('')
const permissionLevel = ref<MenuItemPermissionLevel>('View')

const userOptions = computed(() => {
  return users.value
    .filter((u) => !isExistingTarget(1, u.id))
    .map((u) => ({
      value: u.id,
      label: u.username || u.name || u.id
    }))
})

async function loadUsers() {
  usersLoading.value = true
  try {
    const data = await fetchUsersSelectSorted()
    users.value = data.map((u) => ({
      id: u.value,
      username: u.label,
      name: u.label
    }))
  } catch (error) {
    console.error('Failed to load users:', error)
    ElMessage.error('Failed to load users')
  } finally {
    usersLoading.value = false
  }
}

function open() {
  resetForm()
  loadUsers()
  dialogVisible.value = true
}

function close() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  selectedUserId.value = ''
  permissionLevel.value = 'View'
  submitting.value = false
  users.value = []
}

async function handleSubmit() {
  if (!selectedUserId.value) {
    ElMessage.warning('Please select a user')
    return
  }

  const payload: PermissionFormData = {
    targetType: 1,
    targetId: selectedUserId.value,
    permissionLevel: permissionLevel.value
  }

  submitting.value = true
  try {
    emit('submit', payload)
    close()
  } finally {
    submitting.value = false
  }
}

defineExpose({
  open,
  close
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Add User from Other Sources"
    width="460px"
    :close-on-click-modal="false"
    @close="close"
  >
    <el-form label-position="top">
      <el-form-item label="User">
        <el-select
          v-model="selectedUserId"
          placeholder="Search and select a user"
          filterable
          clearable
          :loading="usersLoading"
          style="width: 100%"
        >
          <el-option
            v-for="opt in userOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Permission Level">
        <el-radio-group v-model="permissionLevel" size="small">
          <el-radio-button label="View">View</el-radio-button>
          <el-radio-button label="Edit">Edit</el-radio-button>
          <el-radio-button label="Manage">Manage</el-radio-button>
        </el-radio-group>
        <p class="level-hint">
          {{ permissionLevel === 'View'
            ? 'Can view the menu item and its content.'
            : permissionLevel === 'Edit'
              ? 'Can view and edit the menu item content.'
              : 'Full control: can manage settings, members, and delete the menu item.'
          }}
        </p>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">Cancel</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!selectedUserId"
          @click="handleSubmit"
        >
          Add Permission
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.level-hint {
  margin: var(--app-space-xs) 0 0;
  font-size: var(--app-font-size-s);
  color: var(--app-grey-500);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
