<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
const props = defineProps<{
  menuItem?: { id: string; itemId?: string; label: string; item_type: string }
}>()

const { getItemPermissions, grantPermission, revokePermission } = usePermission()
const { query } = usePglite()
const { initCurrentUser, getCurrentUserId } = useCurrentUser()

// State
const loading = ref(false)
const permissions = ref<PermissionWithUser[]>([])
const users = ref<Array<{ id: string; name: string; email: string; avatar?: string }>>([])

// Add permission dialog state
const showAddDialog = ref(false)
const selectedUserId = ref<string>('')
const selectedRole = ref<PermissionRole>('read')
const addLoading = ref(false)

// Role options
const roleOptions: { value: PermissionRole; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'Can view this table and its data' },
  { value: 'readWrite', label: 'Read & Write', description: 'Can view and edit table data' },
  { value: 'manage', label: 'Manage', description: 'Full control including structure and permissions' }
]

// Get role color
function getRoleType(role: PermissionRole): string {
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

// Load permissions
async function loadPermissions() {
  if (!props.menuItem?.id) return

  loading.value = true
  try {
    permissions.value = await getItemPermissions(props.menuItem.id)
    console.log('permissions', permissions.value, props.menuItem)
  } catch (error) {
    console.error('Failed to load permissions:', error)
    ElMessage.error('Failed to load permissions')
  } finally {
    loading.value = false
  }
}

// Load available users
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
async function handleAddPermission() {
  await loadAvailableUsers()
  selectedUserId.value = ''
  selectedRole.value = 'read'
  showAddDialog.value = true
}

// Add permission
async function addPermission() {
  if (!props.menuItem?.id || !selectedUserId.value) {
    ElMessage.warning('Please select a user')
    return
  }

  addLoading.value = true
  try {
    await grantPermission(props.menuItem.id, selectedUserId.value, selectedRole.value)
    message.success('Permission added successfully')
    showAddDialog.value = false
    await loadPermissions()
  } catch (error) {
    console.error('Failed to add permission:', error)
    message.error('Failed to add permission')
  } finally {
    addLoading.value = false
  }
}

// Update permission role
async function handlePermissionChange(userId: string, newRole: PermissionRole) {
  if (!props.menuItem?.id) return

  try {
    await grantPermission(props.menuItem.id, userId, newRole)
    message.success('Permission updated')
    await loadPermissions()
  } catch (error) {
    console.error('Failed to update permission:', error)
    message.error('Failed to update permission')
  }
}

// Remove permission
async function handleRemovePermission(row: PermissionWithUser) {
  if (!props.menuItem?.id) return

  try {
    await ElMessageBox.confirm(`Remove permission for ${row.userName || row.userEmail}?`, 'Confirm Remove', {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })

    await revokePermission(props.menuItem.id, row.userId)
    message.success('Permission removed')
    await loadPermissions()
  } catch (error) {
    // User cancelled
  }
}

// Check if current user can manage permissions
const canManage = computed(() => {
  const currentUserPermission = permissions.value.find((p) => p.userId === getCurrentUserId())
  return currentUserPermission?.role === 'manage'
})

// Load on mount
onMounted(() => {
  loadPermissions()
})

// Watch for menu item changes
watch(
  () => props.menuItem?.id,
  () => {
    loadPermissions()
  }
)
</script>

<template>
  <el-card class="setting-section" v-loading="loading">
    <template #header>
      <div class="card-header">
        <div>
          <h3>Permissions</h3>
          <p class="description">Manage who can access this table</p>
        </div>
        <el-button v-if="canManage" type="primary" size="small" @click="handleAddPermission">
          <Icon name="material-symbols:add" />
          Add User
        </el-button>
      </div>
    </template>

    <div class="table-container">
      <el-table :data="permissions" style="width: 100%">
        <el-table-column label="User" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.userAvatar">
                {{ row.userName?.charAt(0).toUpperCase() || row.userEmail?.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="user-info">
                <span class="user-name">{{ row.userName || 'Unknown User' }}</span>
                <span class="user-email">{{ row.userEmail }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Role" width="150">
          <template #default="{ row }">
            <el-select
              v-if="canManage && row.userId !== getCurrentUserId()"
              v-model="row.role"
              size="small"
              @change="(val: PermissionRole) => handlePermissionChange(row.userId, val)"
            >
              <el-option v-for="option in roleOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <el-tag v-else :type="getRoleType(row.role)" size="small">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Actions" align="center" width="100">
          <template #default="{ row }">
            <el-button v-if="canManage && row.userId !== getCurrentUserId()" type="danger" link size="small" @click="handleRemovePermission(row)">
              <Icon name="material-symbols:delete-outline" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Empty State -->
      <div v-if="!permissions || (permissions.length === 0 && !loading)" class="empty-state">
        <el-empty description="No permissions set">
          <template #description>
            <p>No permissions set. Only the creator has access.</p>
          </template>
          <el-button v-if="canManage" type="primary" size="small" @click="handleAddPermission"> Add First Permission </el-button>
        </el-empty>
      </div>
    </div>
  </el-card>

  <!-- Add Permission Dialog -->
  <el-dialog v-model="showAddDialog" title="Add Permission" width="400px">
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

    <template #footer>
      <el-button @click="showAddDialog = false">Cancel</el-button>
      <el-button type="primary" :loading="addLoading" @click="addPermission"> Add Permission </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    h3 {
      margin: 0 0 var(--app-space-xs);
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }

    .description {
      color: var(--app-grey-500);
      font-size: var(--app-font-size-s);
      margin: 0;
    }
  }
}

.table-container {
  margin-top: var(--app-space-m);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.user-info {
  display: flex;
  flex-direction: column;

  .user-name {
    font-weight: 500;
    font-size: var(--app-font-size-s);
  }

  .user-email {
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-500);
  }
}

.empty-state {
  padding: var(--app-space-xl) 0;
  text-align: center;
}

.user-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.role-description {
  margin: var(--app-space-xs) 0 0;
  font-size: var(--app-font-size-s);
  color: var(--app-grey-500);
}
</style>
