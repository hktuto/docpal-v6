<script lang="ts" setup>
import type { Table, TableType, TablePermission, TablePermissionAssignment, RowLevelCondition, PermissionSubject, FilterCondition, Column, DetailViewLayout, Database } from '../../types/database'
import { useDatabase, useTable } from '../../composables/useDatabase'
import {ElMessage} from 'element-plus'
import DetailViewLayoutEditor from './DetailViewLayoutEditor.vue'
const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { getUsers, updateTable } = useDatabase()
const { } = useTable(props.database.id, props.table.id)

// Active tab
const activeTab = ref('general')

// Form state
const form = ref({
  name: '',
  description: '',
  tableType: 'private' as TableType,
  permissionAssignments: [] as TablePermissionAssignment[],
  rowLevelConditions: [] as RowLevelCondition[],
  detailViewLayout: undefined as DetailViewLayout | undefined
})

// Initialize form
watchEffect(() => {
  form.value = {
    name: props.table.name,
    description: props.table.description || '',
    tableType: props.table.tableType || 'private',
    permissionAssignments: props.table.permissionAssignments ? [...props.table.permissionAssignments] : [],
    rowLevelConditions: props.table.rowLevelConditions ? [...props.table.rowLevelConditions] : [],
    detailViewLayout: props.table.detailViewLayout ? JSON.parse(JSON.stringify(props.table.detailViewLayout)) : undefined
  }
})

// ========== General Settings ==========
function handleSaveGeneral() {
  updateTable(props.database.id, props.table.id, {
    name: form.value.name,
    description: form.value.description,
    tableType: form.value.tableType
  })
  ElMessage.success('Table settings updated')
}

// ========== Table Permissions ==========
const showAddPermissionDialog = ref(false)
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

function handleAddPermission() {
  editingPermissionId.value = null
  newPermission.value = {
    subjectType: 'user',
    subjectId: '',
    permissions: []
  }
  showAddPermissionDialog.value = true
}

function handleEditPermission(permission: TablePermissionAssignment) {
  editingPermissionId.value = permission.id
  newPermission.value = {
    subjectType: permission.subject.type,
    subjectId: permission.subject.id,
    permissions: [...permission.permissions]
  }
  showAddPermissionDialog.value = true
}

function handleSavePermission() {
  if (!newPermission.value.subjectId || newPermission.value.permissions.length === 0) {
    ElMessage.warning('Please select a subject and at least one permission')
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
    // Edit existing
    const index = form.value.permissionAssignments.findIndex(p => p.id === editingPermissionId.value)
    if (index !== -1) {
      form.value.permissionAssignments[index] = permissionAssignment
    }
  } else {
    // Add new
    form.value.permissionAssignments.push(permissionAssignment)
  }

  showAddPermissionDialog.value = false
  savePermissions()
}

function handleDeletePermission(permissionId: string) {
  if (confirm('Are you sure you want to delete this permission assignment?')) {
    form.value.permissionAssignments = form.value.permissionAssignments.filter(p => p.id !== permissionId)
    savePermissions()
  }
}

function savePermissions() {
  updateTable(props.database.id, props.table.id, {
    permissionAssignments: form.value.permissionAssignments
  })
  ElMessage.success('Permissions updated')
}

// ========== Row-Level Security ==========
const showAddConditionDialog = ref(false)
const editingConditionId = ref<string | null>(null)

const newCondition = ref({
  name: '',
  subjectType: 'user' as 'user' | 'group' | 'role',
  subjectId: '',
  conditions: [] as FilterCondition[],
  enabled: true
})

const currentConditionEdit = ref<FilterCondition | null>(null)

function handleAddRowCondition() {
  editingConditionId.value = null
  newCondition.value = {
    name: '',
    subjectType: 'user',
    subjectId: '',
    conditions: [],
    enabled: true
  }
  showAddConditionDialog.value = true
}

function handleEditRowCondition(condition: RowLevelCondition) {
  editingConditionId.value = condition.id
  newCondition.value = {
    name: condition.name,
    subjectType: condition.subject.type,
    subjectId: condition.subject.id,
    conditions: [...condition.conditions],
    enabled: condition.enabled
  }
  showAddConditionDialog.value = true
}

function handleAddFilterCondition() {
  currentConditionEdit.value = {
    field: '',
    operator: 'equals',
    value: ''
  }
}

function handleSaveFilterCondition() {
  if (!currentConditionEdit.value?.field) return
  
  newCondition.value.conditions.push(currentConditionEdit.value)
  currentConditionEdit.value = null
}

function handleDeleteFilterCondition(index: number) {
  newCondition.value.conditions.splice(index, 1)
}

function handleSaveRowCondition() {
  if (!newCondition.value.name || !newCondition.value.subjectId || newCondition.value.conditions.length === 0) {
    ElMessage.warning('Please fill in all required fields and add at least one condition')
    return
  }

  const user = getUsers().find(u => u.id === newCondition.value.subjectId)
  
  const rowCondition: RowLevelCondition = {
    id: editingConditionId.value || `cond-${Date.now()}`,
    name: newCondition.value.name,
    subject: {
      type: newCondition.value.subjectType,
      id: newCondition.value.subjectId,
      name: user?.name || newCondition.value.subjectId
    },
    conditions: newCondition.value.conditions,
    enabled: newCondition.value.enabled
  }

  if (editingConditionId.value) {
    // Edit existing
    const index = form.value.rowLevelConditions.findIndex(c => c.id === editingConditionId.value)
    if (index !== -1) {
      form.value.rowLevelConditions[index] = rowCondition
    }
  } else {
    // Add new
    form.value.rowLevelConditions.push(rowCondition)
  }

  showAddConditionDialog.value = false
  saveRowConditions()
}

function handleDeleteRowCondition(conditionId: string) {
  if (confirm('Are you sure you want to delete this row-level condition?')) {
    form.value.rowLevelConditions = form.value.rowLevelConditions.filter(c => c.id !== conditionId)
    saveRowConditions()
  }
}

function handleToggleCondition(conditionId: string) {
  const condition = form.value.rowLevelConditions.find(c => c.id === conditionId)
  if (condition) {
    condition.enabled = !condition.enabled
    saveRowConditions()
  }
}

function saveRowConditions() {
  updateTable(props.database.id, props.table.id, {
    rowLevelConditions: form.value.rowLevelConditions
  })
  ElMessage.success('Row-level conditions updated')
}

// ========== Detail View Layout ==========
function handleSaveDetailLayout() {
  updateTable(props.database.id, props.table.id, {
    detailViewLayout: form.value.detailViewLayout
  })
  ElMessage.success('Detail view layout saved successfully')
}

// Get operator label
function getOperatorLabel(operator: string): string {
  const labels: Record<string, string> = {
    equals: 'Equals',
    contains: 'Contains',
    gt: 'Greater than',
    lt: 'Less than',
    gte: 'Greater than or equal',
    lte: 'Less than or equal',
    in: 'In',
    notIn: 'Not in',
    isEmpty: 'Is empty',
    isNotEmpty: 'Is not empty'
  }
  return labels[operator] || operator
}

// Get column name
function getColumnName(field: string): string {
  const column = props.table.columns.find(c => c.field === field)
  return column?.title || field
}
</script>

<template>
  <el-dialog
    :model-value="true"
    title="Table Settings"
    width="900px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- General Settings -->
      <el-tab-pane label="General" name="general">
        <el-form label-position="top" class="settings-form">
          <el-form-item label="Table Name" required>
            <el-input v-model="form.name" placeholder="Enter table name" />
          </el-form-item>

          <el-form-item label="Description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="Optional description"
            />
          </el-form-item>

          <el-form-item label="Table Type">
            <el-radio-group v-model="form.tableType">
              <el-radio value="private">
                <div class="radio-option">
                  <div class="radio-label">🔒 Private</div>
                  <div class="radio-description">Only accessible within this database</div>
                </div>
              </el-radio>
              <el-radio value="public">
                <div class="radio-option">
                  <div class="radio-label">🌐 Public</div>
                  <div class="radio-description">Can link across databases and share externally</div>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          
        </el-form>
      </el-tab-pane>

      <!-- Table Permissions -->
      <el-tab-pane label="Permissions" name="permissions">
        <div class="permissions-section">
          <div class="section-header">
            <div>
              <h3>Table Permissions</h3>
              <p class="section-description">Control who can view, create, edit, or manage this table</p>
            </div>
            <el-button type="primary" @click="handleAddPermission">
              + Add Permission
            </el-button>
          </div>

          <el-table :data="form.permissionAssignments" stripe>
            <el-table-column label="Subject" width="200">
              <template #default="{ row }">
                <div class="subject-cell">
                  <span class="subject-type">{{ row.subject.type }}</span>
                  <span class="subject-name">{{ row.subject.name }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Permissions">
              <template #default="{ row }">
                <div class="permissions-tags">
                  <el-tag
                    v-for="perm in row.permissions"
                    :key="perm"
                    size="small"
                    :type="perm === 'manage' ? 'danger' : perm === 'edit' ? 'warning' : 'info'"
                  >
                    {{ perm }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="120" align="right">
              <template #default="{ row }">
                <el-button text size="small" @click="handleEditPermission(row)">
                  Edit
                </el-button>
                <el-button text size="small" type="danger" @click="handleDeletePermission(row.id)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="form.permissionAssignments.length === 0" class="empty-state">
            <p>No permissions assigned yet. Click "Add Permission" to get started.</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- Row-Level Security -->
      <el-tab-pane label="Row-Level Security" name="row-security">
        <div class="row-security-section">
          <div class="section-header">
            <div>
              <h3>Row-Level Security Rules</h3>
              <p class="section-description">Define conditions to control which rows users can see</p>
            </div>
            <el-button type="primary" @click="handleAddRowCondition">
              + Add Rule
            </el-button>
          </div>

          <div class="conditions-list">
            <div
              v-for="condition in form.rowLevelConditions"
              :key="condition.id"
              class="condition-card"
            >
              <div class="condition-header">
                <div class="condition-title">
                  <el-switch
                    :model-value="condition.enabled"
                    @change="handleToggleCondition(condition.id)"
                  />
                  <span class="condition-name">{{ condition.name }}</span>
                </div>
                <div class="condition-actions">
                  <el-button text size="small" @click="handleEditRowCondition(condition)">
                    Edit
                  </el-button>
                  <el-button text size="small" type="danger" @click="handleDeleteRowCondition(condition.id)">
                    Delete
                  </el-button>
                </div>
              </div>
              
              <div class="condition-body">
                <div class="condition-subject">
                  <span class="label">Applied to:</span>
                  <el-tag size="small">{{ condition.subject.type }}: {{ condition.subject.name }}</el-tag>
                </div>
                
                <div class="condition-filters">
                  <span class="label">Conditions:</span>
                  <div class="filter-list">
                    <el-tag
                      v-for="(filter, index) in condition.conditions"
                      :key="index"
                      size="small"
                      type="info"
                    >
                      {{ getColumnName(filter.field) }} {{ getOperatorLabel(filter.operator) }} {{ filter.value }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="form.rowLevelConditions.length === 0" class="empty-state">
              <p>No row-level security rules defined. Click "Add Rule" to create one.</p>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Detail View Layout -->
      <el-tab-pane label="Detail View" name="detail-view">
        <div class="detail-view-section">
          <div class="section-description">
            <p>Configure how record details are displayed. Drag and resize widgets to customize the layout.</p>
          </div>
          <DetailViewLayoutEditor
            :table="table"
            v-model="form.detailViewLayout"
            @save="handleSaveDetailLayout"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="emit('close')">Close</el-button>
      <el-button type="primary" @click="handleSaveGeneral">
            Save 
          </el-button>
    </template>

    <!-- Add/Edit Permission Dialog -->
    <el-dialog
      v-model="showAddPermissionDialog"
      :title="editingPermissionId ? 'Edit Permission' : 'Add Permission'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Subject Type" required>
          <el-select v-model="newPermission.subjectType" style="width: 100%">
            <el-option label="User" value="user" />
            <el-option label="Group" value="group" />
            <el-option label="Role" value="role" />
          </el-select>
        </el-form-item>

        <el-form-item label="Select User" required v-if="newPermission.subjectType === 'user'">
          <el-select v-model="newPermission.subjectId" placeholder="Select user" style="width: 100%">
            <el-option
              v-for="user in getUsers()"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Group/Role Name" required v-else>
          <el-input v-model="newPermission.subjectId" placeholder="Enter group or role name" />
        </el-form-item>

        <el-form-item label="Permissions" required>
          <el-checkbox-group v-model="newPermission.permissions">
            <div v-for="perm in allPermissions" :key="perm.value" class="permission-checkbox">
              <el-checkbox :value="perm.value">
                <div class="permission-option">
                  <span class="permission-label">{{ perm.label }}</span>
                  <span class="permission-description">{{ perm.description }}</span>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddPermissionDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSavePermission">
          {{ editingPermissionId ? 'Update' : 'Add' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Add/Edit Row Condition Dialog -->
    <el-dialog
      v-model="showAddConditionDialog"
      :title="editingConditionId ? 'Edit Row-Level Rule' : 'Add Row-Level Rule'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Rule Name" required>
          <el-input v-model="newCondition.name" placeholder="e.g., Sales team can only see their own records" />
        </el-form-item>

        <el-form-item label="Subject Type" required>
          <el-select v-model="newCondition.subjectType" style="width: 100%">
            <el-option label="User" value="user" />
            <el-option label="Group" value="group" />
            <el-option label="Role" value="role" />
          </el-select>
        </el-form-item>

        <el-form-item label="Select User" required v-if="newCondition.subjectType === 'user'">
          <el-select v-model="newCondition.subjectId" placeholder="Select user" style="width: 100%">
            <el-option
              v-for="user in getUsers()"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Group/Role Name" required v-else>
          <el-input v-model="newCondition.subjectId" placeholder="Enter group or role name" />
        </el-form-item>

        <el-form-item label="Filter Conditions" required>
          <div class="conditions-builder">
            <div v-for="(cond, index) in newCondition.conditions" :key="index" class="condition-item">
              <el-tag closable @close="handleDeleteFilterCondition(index)">
                {{ getColumnName(cond.field) }} {{ getOperatorLabel(cond.operator) }} {{ cond.value }}
              </el-tag>
            </div>

            <el-button v-if="!currentConditionEdit" text @click="handleAddFilterCondition">
              + Add Condition
            </el-button>

            <div v-if="currentConditionEdit" class="condition-editor">
              <el-select v-model="currentConditionEdit.field" placeholder="Field" style="width: 150px">
                <el-option
                  v-for="col in table.columns"
                  :key="col.id"
                  :label="col.title"
                  :value="col.field"
                />
              </el-select>

              <el-select v-model="currentConditionEdit.operator" placeholder="Operator" style="width: 150px">
                <el-option label="Equals" value="equals" />
                <el-option label="Contains" value="contains" />
                <el-option label="Greater than" value="gt" />
                <el-option label="Less than" value="lt" />
                <el-option label="Is empty" value="isEmpty" />
                <el-option label="Is not empty" value="isNotEmpty" />
              </el-select>

              <el-input
                v-if="!['isEmpty', 'isNotEmpty'].includes(currentConditionEdit.operator)"
                v-model="currentConditionEdit.value"
                placeholder="Value"
                style="width: 150px"
              />

              <el-button type="primary" size="small" @click="handleSaveFilterCondition">
                Save
              </el-button>
              <el-button size="small" @click="currentConditionEdit = null">
                Cancel
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Status">
          <el-switch v-model="newCondition.enabled" active-text="Enabled" inactive-text="Disabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddConditionDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSaveRowCondition">
          {{ editingConditionId ? 'Update' : 'Add' }}
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style lang="scss" scoped>
.settings-tabs {
  min-height: 500px;
}

.settings-form {
  max-width: 600px;
}

.radio-option {
  .radio-label {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .radio-description {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.permissions-section,
.row-security-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--app-space-m);
    
    h3 {
      margin: 0 0 var(--app-space-xxs) 0;
      font-size: var(--app-font-size-l);
      color: var(--app-text-color-primary);
    }
    
    .section-description {
      margin: 0;
      font-size: var(--app-font-size-s);
      color: var(--app-text-color-secondary);
    }
  }
}

.subject-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .subject-type {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-placeholder);
    text-transform: uppercase;
  }
  
  .subject-name {
    font-weight: 500;
  }
}

.permissions-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
}

.empty-state {
  text-align: center;
  padding: var(--app-space-xl);
  color: var(--app-text-color-secondary);
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-s);
  margin-top: var(--app-space-m);
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.condition-card {
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-m);
  background: var(--app-paper);
  
  .condition-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--app-space-s);
    
    .condition-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-s);
      
      .condition-name {
        font-weight: 600;
        font-size: var(--app-font-size-m);
      }
    }
    
    .condition-actions {
      display: flex;
      gap: var(--app-space-xs);
    }
  }
  
  .condition-body {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
    
    .label {
      font-size: var(--app-font-size-s);
      color: var(--app-text-color-secondary);
      margin-right: var(--app-space-xs);
    }
    
    .condition-subject {
      display: flex;
      align-items: center;
    }
    
    .condition-filters {
      display: flex;
      align-items: flex-start;
      
      .filter-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-xs);
      }
    }
  }
}

.permission-checkbox {
  margin-bottom: var(--app-space-s);
  
  .permission-option {
    display: flex;
    flex-direction: column;
    
    .permission-label {
      font-weight: 500;
    }
    
    .permission-description {
      font-size: var(--app-font-size-s);
      color: var(--app-text-color-secondary);
    }
  }
}

.conditions-builder {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-s);
  min-height: 100px;
  
  .condition-item {
    display: flex;
    align-items: center;
  }
  
  .condition-editor {
    display: flex;
    gap: var(--app-space-xs);
    flex-wrap: wrap;
  }
}

.detail-view-section {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.section-description {
  padding: var(--app-space-m);
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-s);
  margin-bottom: var(--app-space-m);

  p {
    margin: 0;
    color: var(--app-text-color-secondary);
    font-size: var(--app-font-size-s);
  }
}
</style>

