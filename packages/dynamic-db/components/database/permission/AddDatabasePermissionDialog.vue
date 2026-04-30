<script setup lang="ts">
import { ElMessage } from 'element-plus'

/* ─── Permission ID reference ───
 * 47 : database:read   (Member)
 * 48 : database:manage (Manage)
 * 49 : member:manage   (Manage)
 */
const PERMISSION_IDS = {
  Member: [47],
  Manage: [47, 48, 49]
} as const

type PermissionLevel = 'Member' | 'Manage'

interface TargetOption {
  id: string
  name: string
}

interface PermissionFormData {
  targetType: number
  targetId: string
  targetName: string
  permissionLevel: PermissionLevel
  permissionIds: number[]
}

const emit = defineEmits<{
  submit: [data: PermissionFormData]
}>()

const dialogVisible = ref(false)
const submitting = ref(false)

// ─── Target lists (populate via API) ───
const users = ref<TargetOption[]>([])
const roles = ref<TargetOption[]>([])
const groups = ref<TargetOption[]>([])

const selectedTarget = ref('')
const targetName = ref('')
const permissionLevel = ref<PermissionLevel>('Member')

// Auto-fill targetName when selection changes
watch(selectedTarget, (val) => {
  if (!val) {
    targetName.value = ''
    return
  }
  const [typeStr, ...idParts] = val.split(':')
  const type = parseInt(typeStr, 10)
  const id = idParts.join(':')

  if (type === 1) targetName.value = users.value.find((u) => u.id === id)?.name || id
  else if (type === 2) targetName.value = roles.value.find((r) => r.id === id)?.name || id
  else if (type === 3) targetName.value = groups.value.find((g) => g.id === id)?.name || id
})

// ─── Dropdown options ───
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
    options: users.value.map((u) => ({ value: `1:${u.id}`, label: u.name }))
  },
  {
    label: 'Roles',
    type: 2,
    icon: 'lucide:shield',
    options: roles.value.map((r) => ({ value: `2:${r.id}`, label: r.name }))
  },
  {
    label: 'Groups',
    type: 3,
    icon: 'lucide:users',
    options: groups.value.map((g) => ({ value: `3:${g.id}`, label: g.name }))
  }
].filter((g) => g.options.length > 0))

// ─── Parse selected value ───
const parsedTarget = computed(() => {
  if (!selectedTarget.value) return null
  const [typeStr, ...idParts] = selectedTarget.value.split(':')
  const type = parseInt(typeStr, 10)
  const id = idParts.join(':')

  let name = ''
  if (type === 1) name = users.value.find((u) => u.id === id)?.name || id
  else if (type === 2) name = roles.value.find((r) => r.id === id)?.name || id
  else if (type === 3) name = groups.value.find((g) => g.id === id)?.name || id

  return { type, id, name }
})

// ─── Dialog control ───
function open() {
  resetForm()
  dialogVisible.value = true
}

function close() {
  dialogVisible.value = false
  resetForm()
}

function resetForm() {
  selectedTarget.value = ''
  targetName.value = ''
  permissionLevel.value = 'Member'
  submitting.value = false
}

// ─── Submit ───
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
    targetName: targetName.value || id,
    permissionLevel: level,
    permissionIds: [...PERMISSION_IDS[level]]
  }

  submitting.value = true
  try {
    emit('submit', payload)
    close()
  } finally {
    submitting.value = false
  }
}

// Expose lists so parent can populate them after fetching from API
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
    title="Add Database Permission"
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

      <!-- Target Name (auto-filled, editable) -->
      <el-form-item label="Target Name">
        <el-input
          v-model="targetName"
          placeholder="Target name"
          disabled
        />
      </el-form-item>

      <!-- Permission Level -->
      <el-form-item label="Permission Level">
        <el-radio-group v-model="permissionLevel" size="small">
          <el-radio-button label="Member">Member</el-radio-button>
          <el-radio-button label="Manage">Manage</el-radio-button>
        </el-radio-group>
        <p class="level-hint">
          {{ permissionLevel === 'Member'
            ? 'Can access and view database content.'
            : 'Full control: can change settings and manage members.'
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
