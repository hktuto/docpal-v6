<script lang="ts" setup>
import type { Database, Permission, PermissionSubject } from '../../types/database'
import { Delete } from '@element-plus/icons-vue'
import { useDatabase } from '../../composables/useDatabase'
import groupsRolesData from '../../data/groups-roles.json'

const props = defineProps<{
  database: Database
}>()

const { updateDatabase, getUsers } = useDatabase()

// Form state
const databaseName = ref(props.database.name)
const databaseDescription = ref(props.database.description || '')

// Watch for prop changes
watch(() => props.database, (newDb) => {
  databaseName.value = newDb.name
  databaseDescription.value = newDb.description || ''
}, { immediate: true })

// Save database info
function handleSaveInfo() {
  updateDatabase(props.database.id, {
    name: databaseName.value,
    description: databaseDescription.value
  })
  ElMessage.success('Database information updated successfully')
}

// Permission management
interface PermissionAssignment {
  id: string
  subject: PermissionSubject
  permissions: Permission[]
}

const permissions = ref<PermissionAssignment[]>([])

// Initialize permissions from database
watchEffect(() => {
  if (props.database.permissions) {
    permissions.value = props.database.permissions.map((p, index) => ({
      id: `perm-${index}`,
      subject: {
        type: (p.userId ? 'user' : 'role') as 'user' | 'group' | 'role',
        id: p.userId || p.roleId || '',
        name: p.userId 
          ? getUsers().find(u => u.id === p.userId)?.name 
          : groupsRolesData.roles.find(r => r.id === p.roleId)?.name
      },
      permissions: p.permissions
    }))
  }
})

// Add permission dialog
const showAddPermissionDialog = ref(false)
const newPermission = ref<{
  subjectType: 'user' | 'group' | 'role'
  subjectId: string
  permissions: Permission[]
}>({
  subjectType: 'user',
  subjectId: '',
  permissions: []
})

// Available subjects based on type
const availableSubjects = computed(() => {
  switch (newPermission.value.subjectType) {
    case 'user':
      return getUsers().map(u => ({ id: u.id, name: u.name, email: u.email }))
    case 'group':
      return groupsRolesData.groups.map(g => ({ id: g.id, name: g.name, description: g.description }))
    case 'role':
      return groupsRolesData.roles.map(r => ({ id: r.id, name: r.name, description: r.description }))
    default:
      return []
  }
})

const permissionOptions: { value: Permission; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'View database and records' },
  { value: 'write', label: 'Write', description: 'Create and edit records' },
  { value: 'delete', label: 'Delete', description: 'Delete records and tables' },
  { value: 'manage', label: 'Manage', description: 'Full database administration' }
]

function handleOpenAddPermission() {
  newPermission.value = {
    subjectType: 'user',
    subjectId: '',
    permissions: []
  }
  showAddPermissionDialog.value = true
}

function handleAddPermission() {
  if (!newPermission.value.subjectId || newPermission.value.permissions.length === 0) {
    ElMessage.warning('Please select a subject and at least one permission')
    return
  }

  const subject = availableSubjects.value.find(s => s.id === newPermission.value.subjectId)
  if (!subject) return

  const newPerm: PermissionAssignment = {
    id: `perm-${Date.now()}`,
    subject: {
      type: newPermission.value.subjectType,
      id: subject.id,
      name: subject.name
    },
    permissions: [...newPermission.value.permissions]
  }

  permissions.value.push(newPerm)
  savePermissions()
  showAddPermissionDialog.value = false
}

function handleDeletePermission(permissionId: string) {
  const index = permissions.value.findIndex(p => p.id === permissionId)
  if (index !== -1) {
    permissions.value.splice(index, 1)
    savePermissions()
  }
}

function handleUpdatePermissions(permissionId: string, newPerms: Permission[]) {
  const perm = permissions.value.find(p => p.id === permissionId)
  if (perm) {
    perm.permissions = newPerms
    savePermissions()
  }
}

function savePermissions() {
  const dbPermissions = permissions.value.map(p => {
    const assignment: any = {
      permissions: p.permissions
    }
    if (p.subject.type === 'user') {
      assignment.userId = p.subject.id
    } else if (p.subject.type === 'role') {
      assignment.roleId = p.subject.id
    }
    return assignment
  })

  updateDatabase(props.database.id, {
    permissions: dbPermissions
  })
  ElMessage.success('Permissions updated successfully')
}

function getSubjectTypeIcon(type: 'user' | 'group' | 'role'): string {
  const icons = {
    user: '👤',
    group: '👥',
    role: '🎭'
  }
  return icons[type]
}

function getPermissionColor(permission: Permission): string {
  const colors = {
    read: 'info',
    write: 'success',
    delete: 'danger',
    manage: 'warning'
  }
  return colors[permission] || 'info'
}
</script>

<template>
  <div class="database-settings">
    <div class="settings-header">
      <h2>Database Settings</h2>
    </div>

    <div class="settings-content">
      <!-- Database Information -->
      <div class="settings-section">
        <div class="section-header">
          <h3>Database Information</h3>
        </div>
        <el-form label-position="top" class="settings-form">
          <el-form-item label="Database Name" required>
            <el-input
              v-model="databaseName"
              placeholder="Enter database name"
            />
          </el-form-item>
          <el-form-item label="Description">
            <el-input
              v-model="databaseDescription"
              type="textarea"
              :rows="3"
              placeholder="Enter database description"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveInfo">
              Save Changes
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Permissions -->
      <div class="settings-section">
        <div class="section-header">
          <h3>Access Permissions</h3>
          <el-button type="primary" size="small" @click="handleOpenAddPermission">
            Add Permission
          </el-button>
        </div>

        <div v-if="permissions.length === 0" class="empty-state">
          <p>No permissions assigned yet. Add permissions to control access to this database.</p>
        </div>

        <div v-else class="permissions-list">
          <div
            v-for="perm in permissions"
            :key="perm.id"
            class="permission-item"
          >
            <div class="permission-subject">
              <span class="subject-icon">{{ getSubjectTypeIcon(perm.subject.type) }}</span>
              <div class="subject-info">
                <div class="subject-name">{{ perm.subject.name }}</div>
                <div class="subject-type">{{ perm.subject.type }}</div>
              </div>
            </div>
            <div class="permission-perms">
              <el-select
                :model-value="perm.permissions"
                multiple
                placeholder="Select permissions"
                style="width: 300px"
                @change="(val: Permission[]) => handleUpdatePermissions(perm.id, val)"
              >
                <el-option
                  v-for="opt in permissionOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                >
                  <div>
                    <div>{{ opt.label }}</div>
                    <div style="font-size: 12px; color: var(--app-text-color-secondary)">
                      {{ opt.description }}
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div class="permission-actions">
              <el-button
                type="danger"
                text
                :icon="Delete"
                @click="handleDeletePermission(perm.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Permission Dialog -->
    <el-dialog
      v-model="showAddPermissionDialog"
      title="Add Permission"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Subject Type" required>
          <el-radio-group v-model="newPermission.subjectType">
            <el-radio-button value="user">
              <span>👤 User</span>
            </el-radio-button>
            <el-radio-button value="group">
              <span>👥 Group</span>
            </el-radio-button>
            <el-radio-button value="role">
              <span>🎭 Role</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          :label="newPermission.subjectType === 'user' ? 'Select User' : newPermission.subjectType === 'group' ? 'Select Group' : 'Select Role'"
          required
        >
          <el-select
            v-model="newPermission.subjectId"
            placeholder="Select..."
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="subject in availableSubjects"
              :key="subject.id"
              :label="subject.name"
              :value="subject.id"
            >
              <div>
                <div>{{ subject.name }}</div>
                <div
                  v-if="'email' in subject || 'description' in subject"
                  style="font-size: 12px; color: var(--app-text-color-secondary)"
                >
                  {{ 'email' in subject ? subject.email : subject.description }}
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Permissions" required>
          <el-checkbox-group v-model="newPermission.permissions">
            <el-checkbox
              v-for="opt in permissionOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.value"
            >
              <div class="permission-checkbox-label">
                <span class="permission-label">{{ opt.label }}</span>
                <span class="permission-description">{{ opt.description }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddPermissionDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="!newPermission.subjectId || newPermission.permissions.length === 0"
          @click="handleAddPermission"
        >
          Add Permission
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.database-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-color-page);
}

.settings-header {
  padding: var(--app-space-m) var(--app-space-l);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-paper);

  h2 {
    margin: 0;
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--app-text-color-primary);
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-l);
}

.settings-section {
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
  margin-bottom: var(--app-space-l);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-m);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
    color: var(--app-text-color-primary);
  }
}

.settings-form {
  max-width: 600px;
}

.empty-state {
  padding: var(--app-space-xl) var(--app-space-l);
  text-align: center;
  color: var(--app-text-color-secondary);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.permission-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  background: var(--app-fill-color);

  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-primary-alpha-10);
  }
}

.permission-subject {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  min-width: 200px;
}

.subject-icon {
  font-size: var(--app-font-size-xl);
}

.subject-info {
  flex: 1;
}

.subject-name {
  font-weight: 500;
  color: var(--app-text-color-primary);
}

.subject-type {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  text-transform: capitalize;
}

.permission-perms {
  flex: 1;
}

.permission-actions {
  flex-shrink: 0;
}

.permission-checkbox-label {
  display: flex;
  flex-direction: column;
  margin-left: var(--app-space-xs);
}

.permission-label {
  font-weight: 500;
  color: var(--app-text-color-primary);
}

.permission-description {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

:deep(.el-checkbox) {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--app-space-s);
  height: auto;
  white-space: normal;
}

:deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.4;
}
</style>

