<script lang="ts" setup>
import type { Database, Table, Column } from '../../../types/database'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
  openFormEditor: []
}>()

// Form configuration (can be stored in table.formConfig in the future)
const formConfig = ref({
  title: 'Create New Record',
  description: 'Fill in the form to create a new record',
  layout: 'single-column' as 'single-column' | 'two-column',
  showFieldDescriptions: true,
  submitButtonText: 'Submit',
  cancelButtonText: 'Cancel'
})

// Get visible columns for form
const formFields = computed(() => {
  return props.table.columns.filter(col => 
    // Exclude formula and rollup fields from forms
    col.type !== 'fx' && col.type !== 'rollup'
  ).map(col => {
    // Ensure select fields have all required V-form properties
    if (col.type === 'single-select' || col.type === 'multi-select') {
      return {
        ...col,
        // Add V-form specific properties if not present
        filterable: col.filterable !== undefined ? col.filterable : true,
        allowCreate: col.allowCreate !== undefined ? col.allowCreate : false,
        clearable: col.clearable !== undefined ? col.clearable : true,
        remote: col.remote !== undefined ? col.remote : false,
        automaticDropdown: col.automaticDropdown !== undefined ? col.automaticDropdown : false
      }
    }
    return col
  })
})

// Group fields by type for better preview organization
const fieldGroups = computed(() => {
  const groups = {
    basic: [] as Column[],
    advanced: [] as Column[],
    relations: [] as Column[]
  }
  
  formFields.value.forEach(field => {
    if (['relation', 'attachment'].includes(field.type)) {
      groups.relations.push(field)
    } else if (['single-select', 'multi-select', 'date', 'user'].includes(field.type)) {
      groups.advanced.push(field)
    } else {
      groups.basic.push(field)
    }
  })
  
  return groups
})

// Get field icon
function getFieldIcon(type: string): string {
  const icons: Record<string, string> = {
    'text': 'Document',
    'textarea': 'Tickets',
    'number': 'Histogram',
    'single-select': 'Select',
    'multi-select': 'Grid',
    'date': 'Calendar',
    'checkbox': 'Check',
    'switch': 'Switch',
    'user': 'User',
    'rating': 'Star',
    'email': 'Message',
    'url': 'Link',
    'attachment': 'Paperclip',
    'relation': 'Connection'
  }
  return icons[type] || 'Document'
}

// Get field type label
function getFieldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'text': 'Text Input',
    'textarea': 'Long Text',
    'number': 'Number Input',
    'single-select': 'Dropdown',
    'multi-select': 'Multi-Select',
    'date': 'Date Picker',
    'checkbox': 'Checkbox',
    'switch': 'Toggle',
    'user': 'User Select',
    'rating': 'Star Rating',
    'email': 'Email Input',
    'url': 'URL Input',
    'attachment': 'File Upload',
    'relation': 'Link to Record'
  }
  return labels[type] || type
}

// Handle edit form
function handleEditForm() {
  emit('openFormEditor')
  // For demo purposes, show a placeholder message
  ElMessage.info('Form editor will open here. Connect to your existing form editor.')
}

// Stats
const requiredFieldsCount = computed(() => 
  formFields.value.filter(f => f.required).length
)
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="header-content">
        <div>
          <h2 class="section-title">Forms</h2>
          <p class="section-description">
            Configure the default form layout for creating and editing records
          </p>
        </div>
        <el-button type="primary" @click="handleEditForm">
          <el-icon><Edit /></el-icon>
          Edit Form
        </el-button>
      </div>
    </div>

    <div class="section-content">
      <!-- Form Stats -->
      <div class="form-stats">
        <div class="stat-item">
          <el-icon><Document /></el-icon>
          <div class="stat-content">
            <span class="stat-value">{{ formFields.length }}</span>
            <span class="stat-label">Form Fields</span>
          </div>
        </div>
        <div class="stat-item">
          <el-icon><Warning /></el-icon>
          <div class="stat-content">
            <span class="stat-value">{{ requiredFieldsCount }}</span>
            <span class="stat-label">Required</span>
          </div>
        </div>
        <div class="stat-item">
          <el-icon><Grid /></el-icon>
          <div class="stat-content">
            <span class="stat-value">{{ formConfig.layout === 'single-column' ? '1' : '2' }}</span>
            <span class="stat-label">Column Layout</span>
          </div>
        </div>
      </div>

      <!-- Form Preview -->
      <div class="form-preview">
        <div class="form-preview-header">
          <h3>{{ formConfig.title }}</h3>
          <p v-if="formConfig.description">{{ formConfig.description }}</p>
        </div>

        <div class="form-preview-body" :class="{ 'two-column': formConfig.layout === 'two-column' }">
          <!-- Basic Fields -->
          <div v-if="fieldGroups.basic.length" class="field-group">
            <div class="group-title">Basic Information</div>
            <div
              v-for="field in fieldGroups.basic"
              :key="field.id"
              class="form-field-preview"
            >
              <div class="field-label">
                <span>{{ field.title }}</span>
                <el-tag v-if="field.required" size="small" type="danger">Required</el-tag>
              </div>
              <div class="field-input">
                <el-icon>
                  <component :is="getFieldIcon(field.type)" />
                </el-icon>
                <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
              </div>
            </div>
          </div>

          <!-- Advanced Fields -->
          <div v-if="fieldGroups.advanced.length" class="field-group">
            <div class="group-title">Additional Details</div>
            <div
              v-for="field in fieldGroups.advanced"
              :key="field.id"
              class="form-field-preview"
            >
              <div class="field-label">
                <span>{{ field.title }}</span>
                <el-tag v-if="field.required" size="small" type="danger">Required</el-tag>
              </div>
              <div class="field-input">
                <el-icon>
                  <component :is="getFieldIcon(field.type)" />
                </el-icon>
                <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
              </div>
            </div>
          </div>

          <!-- Relations -->
          <div v-if="fieldGroups.relations.length" class="field-group">
            <div class="group-title">Relationships</div>
            <div
              v-for="field in fieldGroups.relations"
              :key="field.id"
              class="form-field-preview"
            >
              <div class="field-label">
                <span>{{ field.title }}</span>
                <el-tag v-if="field.required" size="small" type="danger">Required</el-tag>
              </div>
              <div class="field-input">
                <el-icon>
                  <component :is="getFieldIcon(field.type)" />
                </el-icon>
                <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-preview-footer">
          <el-button>{{ formConfig.cancelButtonText }}</el-button>
          <el-button type="primary">{{ formConfig.submitButtonText }}</el-button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            Form Preview
          </template>
          <template #default>
            This is a preview of your default form. Click "Edit Form" to customize the layout, field order, grouping, and validation rules using the full form editor.
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 1000px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.form-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--app-space-m);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);

  .el-icon {
    font-size: 24px;
    color: var(--app-primary-color);
  }
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.stat-value {
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.stat-label {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.form-preview {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
}

.form-preview-header {
  padding: var(--app-space-l);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-fill-color-light);

  h3 {
    margin: 0 0 var(--app-space-xxs) 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
    color: var(--app-text-color-primary);
  }

  p {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.form-preview-body {
  padding: var(--app-space-l);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);

  &.two-column {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--app-space-l);
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.group-title {
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
  padding-bottom: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);
}

.form-field-preview {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.field-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  font-weight: 500;
}

.field-input {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);

  .el-icon {
    color: var(--app-text-color-secondary);
  }
}

.field-type {
  color: var(--app-text-color-secondary);
}

.form-preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  padding: var(--app-space-l);
  border-top: 1px solid var(--app-border-color);
  background: var(--app-fill-color-light);
}

.quick-actions {
  :deep(.el-alert) {
    border-radius: var(--app-border-radius-m);
  }
}
</style>

