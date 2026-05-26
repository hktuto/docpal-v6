<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'
import { useSingleDatabaseContext } from '../../../composables/useSignleDatabase'
import AddDatabaseMenuPermissionFromOtherDialog from './AddDatabaseMenuPermissionFromOtherDialog.vue'

type MenuItemPermissionLevel = 'View' | 'Edit' | 'Manage'

interface TargetOption {
  id: string
  name?: string
  username?: string
}

interface PermissionFormData {
  targetType: number
  targetId: string
  permissionLevel: MenuItemPermissionLevel
}

const props = defineProps<{
  existList: { targetType: number; targetId: string; isInherit?: boolean }[]
}>()
const { permissions } = useSingleDatabaseContext()
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
const targetsLoading = ref(false)

const users = ref<TargetOption[]>([])
const roles = ref<TargetOption[]>([])
const groups = ref<TargetOption[]>([])

async function loadTargets() {
  targetsLoading.value = true
  try {
    await Promise.all([
      loadUsers(),
      loadRoles(),
      loadGroups()
    ])
  } finally {
    targetsLoading.value = false
  }
}

async function loadUsers() {
  const result = permissions.value.filter((r: any) => r.targetType === 1).map((r: any) => ({
    id: r.targetId,
    name: r.targetName
  }))
  const groups = permissions.value.filter((r: any) => r.targetType === 3)
  const roles = permissions.value.filter((r: any) => r.targetType === 2)
  if (groups.length) {
    const groupPromise = await Promise.all([
      ...groups.map((g: any) => newClientApi.postUcenterMember({ groupId: g.targetId }))
    ])
    groupPromise.forEach((g: any) => result.push(...g.data.map((u: any) => ({ id: u.userId, name: u.username || u.name }))))
  }
  if (roles.length) {
    const rolePromises = await Promise.all(
      roles.map((r: any) => newClientApi.postDocpalAclRoleUsersPage({
        pageNum: 1,
        pageSize: 100,
        conditions: [{ column: 'acRoleId', type: 'EQ', values: r.targetId }]
      }))
    )
    rolePromises.forEach((r: any) => result.push(...r.data.entryList.map((u: any) => ({ id: u.userId, name: u.username }))))
  }

  // De-duplicate by user id
  const userMap = new Map<string, TargetOption>()
  result.forEach((u) => {
    if (!userMap.has(u.id)) {
      userMap.set(u.id, u)
    }
  })
  users.value = Array.from(userMap.values())
}

async function loadRoles() {
  roles.value = permissions.value.filter((r:any) => r.targetType === 2).map((r:any) => ({
    id: r.targetId,
    name: r.targetName
  }))
}

async function loadGroups() {
  groups.value = permissions.value.filter((r:any) => r.targetType === 3).map((r:any) => ({
    id: r.targetId,
    name: r.targetName
  }))
}

const selectedTarget = ref('')
const permissionLevel = ref<MenuItemPermissionLevel>('View')

interface SelectGroup {
  label: string
  type: number
  icon: string
  options: { value: string; label: string }[]
}

const selectGroups = computed<SelectGroup[]>(() => [
  {
    label: 'Users',
    type: 1,
    icon: 'lucide:user',
    options: users.value
      .filter((u) => !isExistingTarget(1, u.id))
      .map((u) => ({ value: `1:${u.id}`, label: u.username || u.name || u.id }))
  },
  {
    label: 'Roles',
    type: 2,
    icon: 'lucide:shield',
    options: roles.value
      .filter((r) => !isExistingTarget(2, r.id))
      .map((r) => ({ value: `2:${r.id}`, label: r.name || r.id }))
  },
  {
    label: 'Groups',
    type: 3,
    icon: 'lucide:users',
    options: groups.value
      .filter((g) => !isExistingTarget(3, g.id))
      .map((g) => ({ value: `3:${g.id}`, label: g.name || g.id }))
  }
].filter((g) => g.options.length > 0))

const parsedTarget = computed(() => {
  if (!selectedTarget.value) return null
  const [typeStr, ...idParts] = selectedTarget.value.split(':')
  const type = parseInt(typeStr, 10)
  const id = idParts.join(':')

  let displayName = ''
  if (type === 1) {
    const u = users.value.find((x) => x.id === id)
    displayName = u?.username || u?.name || id
  } else if (type === 2) {
    const r = roles.value.find((x) => x.id === id)
    displayName = r?.name || id
  } else if (type === 3) {
    const g = groups.value.find((x) => x.id === id)
    displayName = g?.name || id
  }

  return { type, id, name: displayName }
})

async function open() {
  resetForm()
  await loadTargets()
  dialogVisible.value = true
}

function close() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  selectedTarget.value = ''
  permissionLevel.value = 'View'
  submitting.value = false
}

const fromOtherDialogRef = ref()

function openFromOtherDialog() {
  fromOtherDialogRef.value?.open()
}

function handleFromOtherSubmit(data: PermissionFormData) {
  emit('submit', data)
  close()
}

async function handleSubmit() {
  if (!parsedTarget.value) {
    ElMessage.warning('Please select a target')
    return
  }

  const { type, id } = parsedTarget.value
  const level = permissionLevel.value

  const payload: PermissionFormData = {
    targetType: type,
    targetId: id,
    permissionLevel: level
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
  close,
  users,
  roles,
  groups
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Add Menu Item Permission"
    width="460px"
    :close-on-click-modal="false"
    @close="close"
  >
    <el-form label-position="top">
      <!-- Target Selector -->
      <el-form-item label="Target">
        <el-select
          v-model="selectedTarget"
          placeholder="Search and select user, role or group"
          filterable
          clearable
          :loading="targetsLoading"
          style="width: 100%"
        >
          <el-option-group
            v-for="group in selectGroups"
            :key="group.label"
            :label="group.label"
          >
            <el-option
              v-for="opt in group.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            >
              <div class="target-option">
                <Icon :name="group.icon" class="target-option-icon" />
                <span>{{ opt.label }}</span>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button link type="primary" @click="openFromOtherDialog">
          Can't find the user? Select from all users
        </el-button>
      </el-form-item>

      <!-- Permission Level -->
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
          :disabled="!selectedTarget"
          @click="handleSubmit"
        >
          Add Permission
        </el-button>
      </div>
    </template>
    <AddDatabaseMenuPermissionFromOtherDialog
      ref="fromOtherDialogRef"
      :exist-list="existList"
      @submit="handleFromOtherSubmit"
    />
  </el-dialog>
</template>

<style lang="scss" scoped>
.target-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.target-option-icon {
  font-size: 16px;
  color: var(--app-grey-500);
}

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
