<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
interface Props {
  itemId: string
  itemLabel: string
  item_type: 'folder' | 'table' | 'view' | 'dashboard'
}

const props = defineProps<Props>()

// Local state for when item data is passed directly via open()
const localItem = ref<{ id: string; label: string; item_type: string } | null>(null)

// Use local item data if available, otherwise fall back to props
const effectiveItemId = computed(() => localItem.value?.id || props.itemId)
const effectiveItemLabel = computed(() => localItem.value?.label || props.itemLabel)
const effectiveItemType = computed(() => (localItem.value?.item_type || props.item_type) as 'folder' | 'table' | 'view' | 'dashboard')

const emit = defineEmits<{
  close: []
}>()

// Services
const { getItemPermissions, grantPermission, revokePermission, assignCreatorPermission } = usePermission()
const { query } = usePglite()
const { initCurrentUser, getCurrentUserId } = useCurrentUser()

// State
const popoverRef = ref()
const loading = ref(false)
const permissions = ref<PermissionWithUser[]>([])
const users = ref<Array<any>>([])

// Add permission dialog state
const showAddDialog = ref(false)
const selectedUserId = ref<string>('')
const selectedRole = ref<PermissionRole>('read')
const addLoading = ref(false)

// Role options
const roleOptions: { value: PermissionRole; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'Can view this item and its contents' },
  { value: 'readWrite', label: 'Read & Write', description: 'Can view and edit this item and its contents' },
  { value: 'manage', label: 'Manage', description: 'Full control including permissions' }
]

// Get role color
function getRoleColor(role: PermissionRole): string {
  switch (role) {
    case 'read':
      return 'info'
    case 'readWrite':
      return 'warning'
    case 'manage':
      return 'success'
    default:
      return 'default'
  }
}

// Get role label
function getRoleLabel(role: PermissionRole): string {
  return roleOptions.find((r) => r.value === role)?.label || role
}

// Open popover
async function open(target: HTMLElement, itemData?: TreeItem | null) {
  // Store item data locally if provided
  if (itemData) {
    localItem.value = {
      id: itemData.id,
      label: itemData.label,
      item_type: itemData.item_type
    }
  }
  
  popoverRef.value?.open(target)
  await loadPermissions()
  await loadAvailableUsers()
}

// Close popover
function close() {
  popoverRef.value?.close()
  emit('close')
}

// Load permissions for this item
async function loadPermissions() {
  // Skip if no valid itemId
  const itemId = effectiveItemId.value
  if (!itemId) {
    permissions.value = []
    return
  }
  
  loading.value = true
  try {
    permissions.value = await getItemPermissions(itemId)
  } catch (error) {
    console.error('Failed to load permissions:', error)
    ElMessage.error('Failed to load permissions')
  } finally {
    loading.value = false
  }
}

// Load available users (excluding those already with permissions)
async function loadAvailableUsers() {
  try {
    const result = await query<{ id: string; name: string; email: string; avatar: string }[]>(
      `SELECT id, name, email, avatar FROM users WHERE id != $1 ORDER BY name`,
      [getCurrentUserId()]
    )

    // Filter out users who already have permissions
    const existingUserIds = new Set(permissions.value.map((p) => p.userId))
    users.value = result.filter((u) => !existingUserIds.has(u.id))
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

// Show add permission dialog
function showAddPermission() {
  selectedUserId.value = ''
  selectedRole.value = 'read'
  showAddDialog.value = true
}

// Add permission
async function addPermission() {
  if (!selectedUserId.value) {
    ElMessage.warning('Please select a user')
    return
  }

  const itemId = effectiveItemId.value
  if (!itemId) {
    ElMessage.error('No item selected')
    return
  }

  addLoading.value = true
  try {
    await grantPermission(itemId, selectedUserId.value, selectedRole.value)
    ElMessage.success('Permission added successfully')
    showAddDialog.value = false
    await loadPermissions()
    await loadAvailableUsers()
  } catch (error) {
    console.error('Failed to add permission:', error)
    ElMessage.error('Failed to add permission')
  } finally {
    addLoading.value = false
  }
}

// Update permission role
async function updatePermission(userId: string, newRole: PermissionRole) {
  const itemId = effectiveItemId.value
  if (!itemId) return
  
  try {
    await grantPermission(itemId, userId, newRole)
    ElMessage.success('Permission updated')
    await loadPermissions()
  } catch (error) {
    console.error('Failed to update permission:', error)
    ElMessage.error('Failed to update permission')
  }
}

// Remove permission
async function removePermission(userId: string, userName?: string) {
  const itemId = effectiveItemId.value
  if (!itemId) return
  
  try {
    await ElMessageBox.confirm(`Remove permission for ${userName || 'this user'}?`, 'Confirm Remove', {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })

    await revokePermission(itemId, userId)
    ElMessage.success('Permission removed')
    await loadPermissions()
    await loadAvailableUsers()
  } catch (error) {
    // User cancelled
  }
}

// Check if current user can manage permissions
const canManage = computed(() => {
  const currentUserPermission = permissions.value.find((p) => p.userId === getCurrentUserId())
  return currentUserPermission?.role === 'manage'
})

defineExpose({ open, close })
</script>

<template>
  <UiPopoverDialog ref="popoverRef" placement="right-start" :width="360" @close="emit('close')">
    <div class="permission-popover">
      <!-- Header -->
      <div class="permission-header">
        <div class="item-info">
          <Icon
            :name="
              effectiveItemType === 'folder'
                ? 'material-symbols:folder-outline'
                : effectiveItemType === 'table'
                  ? 'material-symbols:table-outline'
                  : effectiveItemType === 'view'
                    ? 'material-symbols:view-list-outline'
                    : 'material-symbols:dashboard-outline'
            "
          />
          <span class="item-label">{{ effectiveItemLabel }}</span>
        </div>
        <p class="permission-description">Manage who can access this {{ effectiveItemType }}</p>
      </div>

      <!-- Permission List -->
      <div v-loading="loading" class="permission-list">
        <div v-for="permission in permissions" :key="permission.userId" class="permission-item">
          <div class="user-info">
            <el-avatar :size="32" :src="permission.userAvatar">
              {{ permission.userName?.charAt(0).toUpperCase() || permission.userEmail?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="user-details">
              <span class="user-name">{{ permission.userName || 'Unknown User' }}</span>
              <span class="user-email">{{ permission.userEmail }}</span>
            </div>
          </div>

          <div class="permission-actions">
            <!-- Role Selector (if can manage) -->
            <el-select
              v-if="canManage && permission.userId !== getCurrentUserId()"
              v-model="permission.role"
              size="small"
              style="width: 120px"
              @change="(val: PermissionRole) => updatePermission(permission.userId, val)"
            >
              <el-option v-for="option in roleOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>

            <!-- Role Tag (read-only) -->
            <el-tag v-else :type="getRoleColor(permission.role)" size="small">
              {{ getRoleLabel(permission.role) }}
              <span v-if="permission.userId === getCurrentUserId()" class="you-badge">You</span>
            </el-tag>

            <!-- Remove Button (if can manage and not self) -->
            <el-button
              v-if="canManage && permission.userId !== getCurrentUserId()"
              type="danger"
              link
              size="small"
              @click="removePermission(permission.userId, permission.userName)"
            >
              <Icon name="material-symbols:delete-outline" />
            </el-button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="permissions.length === 0 && !loading" class="empty-state">
          <p>No permissions set. Only the creator has access.</p>
        </div>
      </div>

      <!-- Add Permission Button -->
      <div v-if="canManage" class="permission-footer">
        <el-button type="primary" size="small" @click="showAddPermission">
          <Icon name="material-symbols:add" />
          Add People
        </el-button>
      </div>
    </div>

    <!-- Add Permission Dialog -->
    <el-dialog v-model="showAddDialog" title="Add Permission" width="400px" append-to-body>
      <div class="add-permission-form">
        <el-form label-position="top">
          <el-form-item label="User">
            <el-select v-model="selectedUserId" placeholder="Select a user" filterable style="width: 100%">
              <el-option v-for="user in users" :key="user.id" :label="user.name || user.email" :value="user.id">
                <div class="user-option">
                  <el-avatar :size="24" :src="user.avatar">
                    {{ user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() }}
                  </el-avatar>
                  <span>{{ user.name || user.email }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="Role">
            <el-radio-group v-model="selectedRole">
              <el-radio-button v-for="option in roleOptions" :key="option.value" :label="option.value">
                {{ option.label }}
              </el-radio-button>
            </el-radio-group>
            <p class="role-description">
              {{ roleOptions.find((r) => r.value === selectedRole)?.description }}
            </p>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showAddDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="addLoading" @click="addPermission"> Add Permission </el-button>
      </template>
    </el-dialog>
  </UiPopoverDialog>
</template>

<style scoped lang="scss">
.permission-popover {
  padding: var(--app-space-s);
}

.permission-header {
  margin-bottom: var(--app-space-m);
  padding-bottom: var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);

  .item-info {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    margin-bottom: var(--app-space-xs);

    .item-label {
      font-weight: 600;
      font-size: var(--app-font-size-m);
    }
  }

  .permission-description {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.permission-list {
  max-height: 300px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  flex: 1;
  min-width: 0;

  .user-details {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .user-name {
      font-size: var(--app-font-size-s);
      font-weight: 500;
    }

    .user-email {
      font-size: var(--app-font-size-xs);
      color: var(--app-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.permission-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.you-badge {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: var(--app-space-l);
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.permission-footer {
  margin-top: var(--app-space-m);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
  display: flex;
  justify-content: center;
}

.add-permission-form {
  .user-option {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
  }

  .role-description {
    margin: var(--app-space-xs) 0 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}
</style>
