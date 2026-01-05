<script lang="ts" setup>
import type { Database, Table, TablePermission, TablePermissionAssignment } from '../../../types/database'
import { useDatabase } from '../../../composables/useDatabase'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { getUsers, updateTable } = useDatabase()

// Permissions state
const permissionAssignments = ref<TablePermissionAssignment[]>([])
const showAddDialog = ref(false)
const editingPermissionId = ref<string | null>(null)

const newPermission = ref({
  subjectType: 'user' as 'user' | 'group' | 'role',
  subjectId: '',
  permissions: [] as TablePermission[]
})

const allPermissions: { value: TablePermission; label: string; description: string }[] = [
  { value: 'view', label: 'View', description: 'Can view records in this table' },
  { value: 'create', label: 'Create', description: 'Can create new records' },
  { value: 'edit', label: 'Edit', description: 'Can edit existing records' },
  { value: 'manage', label: 'Manage', description: 'Can manage table structure and settings' }
]

// Initialize
watchEffect(() => {
  permissionAssignments.value = props.table.permissionAssignments ? [...props.table.permissionAssignments] : []
})

function handleAdd() {
  editingPermissionId.value = null
  newPermission.value = {
    subjectType: 'user',
    subjectId: '',
    permissions: []
  }
  showAddDialog.value = true
}

function handleEdit(permission: TablePermissionAssignment) {
  editingPermissionId.value = permission.id
  newPermission.value = {
    subjectType: permission.subject.type,
    subjectId: permission.subject.id,
    permissions: [...permission.permissions]
  }
  showAddDialog.value = true
}

function handleSave() {
  if (!newPermission.value.subjectId || newPermission.value.permissions.length === 0) {
    ElMessage.warning('Please select a user and at least one permission')
    return
  }

  const user = getUsers().find(u => u.id === newPermission.value.subjectId)
  
  const permissionAssignment: TablePermissionAssignment = {
    id: editingPermissionId.value || `perm-${Date.now()}`,
    subject: {
      type: newPermission.value.subjectType,
      id: newPermission.value.subjectId,
      name: user?.name || newPermission.value.subjectId
    },
    permissions: newPermission.value.permissions
  }

  if (editingPermissionId.value) {
    const index = permissionAssignments.value.findIndex(p => p.id === editingPermissionId.value)
    if (index !== -1) {
      permissionAssignments.value[index] = permissionAssignment
    }
  } else {
    permissionAssignments.value.push(permissionAssignment)
  }

  showAddDialog.value = false
  saveChanges()
}

function handleDelete(permissionId: string) {
  ElMessageBox.confirm('Are you sure you want to delete this permission assignment?', 'Delete Permission', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(() => {
    permissionAssignments.value = permissionAssignments.value.filter(p => p.id !== permissionId)
    saveChanges()
  }).catch(() => {})
}

function saveChanges() {
  updateTable(props.database.id, props.table.id, {
    permissionAssignments: permissionAssignments.value
  })
  ElMessage.success('Permissions updated')
  emit('updated')
}

function getPermissionLabel(permission: TablePermission): string {
  const perm = allPermissions.find(p => p.value === permission)
  return perm?.label || permission
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">Table Permissions</h2>
      <p class="section-description">
        Control who can access and modify records in this table
      </p>
    </div>

    <div class="section-content">
      <!-- Permissions List -->
      <div class="permissions-list">
        <div v-if="permissionAssignments.length === 0" class="empty-state">
          <p>No permission assignments yet</p>
          <el-button type="primary" @click="handleAdd">Add Permission</el-button>
        </div>

        <template v-else>
          <div class="permissions-header">
            <span>User/Role</span>
            <span>Permissions</span>
            <span>Actions</span>
          </div>
          
          <div
            v-for="permission in permissionAssignments"
            :key="permission.id"
            class="permission-item"
          >
            <div class="permission-subject">
              <el-icon><User /></el-icon>
              <span>{{ permission.subject.name }}</span>
            </div>
            
            <div class="permission-badges">
              <el-tag
                v-for="perm in permission.permissions"
                :key="perm"
                size="small"
                type="info"
              >
                {{ getPermissionLabel(perm) }}
              </el-tag>
            </div>
            
            <div class="permission-actions">
              <el-button size="small" @click="handleEdit(permission)">Edit</el-button>
              <el-button size="small" type="danger" @click="handleDelete(permission.id)">Delete</el-button>
            </div>
          </div>

          <el-button class="add-button" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            Add Permission
          </el-button>
        </template>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingPermissionId ? 'Edit Permission' : 'Add Permission'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="User" required>
          <el-select
            v-model="newPermission.subjectId"
            placeholder="Select user"
            style="width: 100%"
          >
            <el-option
              v-for="user in getUsers()"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Permissions" required>
          <el-checkbox-group v-model="newPermission.permissions" class="permission-checkboxes">
            <el-checkbox
              v-for="permission in allPermissions"
              :key="permission.value"
              :value="permission.value"
              class="permission-checkbox"
            >
              <div class="permission-option">
                <strong>{{ permission.label }}</strong>
                <span class="permission-desc">{{ permission.description }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleSave"
          :disabled="!newPermission.subjectId || newPermission.permissions.length === 0"
        >
          {{ editingPermissionId ? 'Update' : 'Add' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 900px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.empty-state {
  text-align: center;
  padding: var(--app-space-xxl);
  color: var(--app-text-color-secondary);

  p {
    margin-bottom: var(--app-space-m);
  }
}

.permissions-header {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: var(--app-space-m);
  padding: var(--app-space-s) var(--app-space-m);
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-secondary);
  text-transform: uppercase;
  border-bottom: 1px solid var(--app-border-color);
}

.permission-item {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  align-items: center;
}

.permission-subject {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.permission-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
}

.permission-actions {
  display: flex;
  gap: var(--app-space-xs);
  justify-content: flex-end;
}

.add-button {
  width: 100%;
}

.permission-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
}

.permission-checkbox {
  height: auto;
  white-space: normal;
  align-items: flex-start;

  :deep(.el-checkbox__label) {
    white-space: normal;
    line-height: 1.5;
  }
}

.permission-option {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);

  strong {
    font-size: var(--app-font-size-m);
  }
}

.permission-desc {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}
</style>

