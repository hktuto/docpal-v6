<template>
  <div 
    class="form-preview"
    :class="{
      'layout-single': config.layout === 'single',
      'layout-multi': config.layout === 'multi',
      'label-top': config.labelPosition === 'top',
      'label-left': config.labelPosition === 'left'
    }"
    :style="customStyles"
  >
    <el-form 
      :label-position="config.labelPosition"
      :label-width="config.labelPosition === 'left' ? `${config.labelWidth}px` : undefined"
      class="preview-form"
    >
      <div class="form-fields-grid">
        <template v-for="field in visibleFields" :key="field.fieldName">
          <div 
            class="form-field-wrapper"
            :style="getFieldStyle(field)"
          >
            <el-form-item
              :label="getFieldLabel(field)"
              :required="isFieldRequired(field)"
              class="preview-form-item"
            >
              <component
                :is="getFieldInputComponent(field.fieldName)"
                v-if="getFieldInputComponent(field.fieldName)"
                :value="getFieldValue(field.fieldName)"
                :field-info="getFieldInfo(field.fieldName)"
                disabled
              />
              <div v-else class="field-input-placeholder">
                <div class="placeholder-content">
                  <Icon :name="getFieldIcon(field.fieldName)" size="14" />
                  <span>{{ getFieldPlaceholder(field.fieldName) }}</span>
                </div>
              </div>
            </el-form-item>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="visibleFields.length === 0" class="form-empty">
        <Icon name="lucide:form-input" size="32" />
        <span>No fields configured</span>
        <span class="hint">Add fields from the configuration panel</span>
      </div>
    </el-form>

    <!-- Form Actions Preview -->
    <div v-if="visibleFields.length > 0" class="form-actions-preview">
      <el-button disabled>Cancel</el-button>
      <el-button type="primary" disabled>Save</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormViewConfig, ViewFieldConfig, FieldInfo } from '../../types/view-config'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Form configuration */
  config: FormViewConfig
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Record data to display (optional) */
  sampleData?: Record<string, any>
}>()

// Default sample data for preview
const defaultSampleData: Record<string, any> = {
  name: 'Sample Text',
  email: 'sample@example.com',
  phone: '+1 (555) 123-4567',
  url: 'https://example.com',
  description: 'This is a sample description.',
  amount: 1234.56,
  quantity: 42,
  rating: 4,
  active: true,
  status: 'active',
  priority: ['high', 'medium'],
  dueDate: new Date().toISOString(),
  assignee: 'John Doe'
}

// Use provided sample data or defaults
const recordData = computed(() => {
  return props.sampleData || defaultSampleData
})

// Filter visible fields (not hidden)
const visibleFields = computed(() => {
  return props.config.fields.filter(f => !f.hidden)
})

// Get field info by name
function getFieldInfo(fieldName: string): FieldInfo | undefined {
  return props.fields.find(f => f.fieldName === fieldName)
}

// Get field label
function getFieldLabel(fieldConfig: ViewFieldConfig): string {
  if (fieldConfig.label) return fieldConfig.label
  const fieldInfo = getFieldInfo(fieldConfig.fieldName)
  return fieldInfo?.fieldNameAlias || fieldConfig.fieldName
}

// Check if field is required
function isFieldRequired(fieldConfig: ViewFieldConfig): boolean {
  // Use config value if explicitly set
  if (fieldConfig.required !== undefined) return fieldConfig.required
  
  // Otherwise check field properties
  const fieldInfo = getFieldInfo(fieldConfig.fieldName)
  return fieldInfo?.type !== ColumnFieldType.Checkbox
}

// Get field value
function getFieldValue(fieldName: string): any {
  return recordData.value[fieldName]
}

// Get field style based on colSpan and layout
function getFieldStyle(field: ViewFieldConfig): Record<string, string> {
  const span = field.colSpan || 12
  
  // In single column layout, always full width
  if (props.config.layout === 'single') {
    return { gridColumn: 'span 12' }
  }
  
  return { gridColumn: `span ${span}` }
}

// Get field icon based on type
function getFieldIcon(fieldName: string): string {
  const fieldInfo = getFieldInfo(fieldName)
  if (!fieldInfo) return 'lucide:text'
  
  const iconMap: Record<number, string> = {
    [ColumnFieldType.Text]: 'lucide:type',
    [ColumnFieldType.MultiText]: 'lucide:align-left',
    [ColumnFieldType.Number]: 'lucide:hash',
    [ColumnFieldType.SingleSelect]: 'lucide:chevron-down',
    [ColumnFieldType.MultiSelect]: 'lucide:list-checks',
    [ColumnFieldType.DateTime]: 'lucide:calendar',
    [ColumnFieldType.Checkbox]: 'lucide:check-square',
    [ColumnFieldType.Rating]: 'lucide:star',
    [ColumnFieldType.Email]: 'lucide:mail',
    [ColumnFieldType.URL]: 'lucide:link',
    [ColumnFieldType.Phone]: 'lucide:phone',
    [ColumnFieldType.Member]: 'lucide:user',
    [ColumnFieldType.Attachment]: 'lucide:paperclip',
    [ColumnFieldType.MagicLink]: 'lucide:git-branch',
    [ColumnFieldType.Formula]: 'lucide:function-square',
    [ColumnFieldType.Currency]: 'lucide:dollar-sign',
    [ColumnFieldType.Percent]: 'lucide:percent'
  }
  
  return iconMap[fieldInfo.type] || 'lucide:type'
}

// Get field placeholder text
function getFieldPlaceholder(fieldName: string): string {
  const fieldInfo = getFieldInfo(fieldName)
  if (!fieldInfo) return 'Enter value'
  
  const placeholderMap: Record<number, string> = {
    [ColumnFieldType.Text]: 'Enter text',
    [ColumnFieldType.MultiText]: 'Enter description',
    [ColumnFieldType.Number]: 'Enter number',
    [ColumnFieldType.SingleSelect]: 'Select an option',
    [ColumnFieldType.MultiSelect]: 'Select options',
    [ColumnFieldType.DateTime]: 'Select date',
    [ColumnFieldType.Checkbox]: 'Check/Uncheck',
    [ColumnFieldType.Rating]: 'Rate 1-5',
    [ColumnFieldType.Email]: 'Enter email',
    [ColumnFieldType.URL]: 'Enter URL',
    [ColumnFieldType.Phone]: 'Enter phone',
    [ColumnFieldType.Member]: 'Select member',
    [ColumnFieldType.Attachment]: 'Upload file',
    [ColumnFieldType.MagicLink]: 'Select related',
    [ColumnFieldType.Formula]: 'Auto-calculated',
    [ColumnFieldType.Currency]: 'Enter amount',
    [ColumnFieldType.Percent]: 'Enter percentage'
  }
  
  return placeholderMap[fieldInfo.type] || 'Enter value'
}

// Get custom input component (placeholder for future implementation)
function getFieldInputComponent(fieldName: string): any {
  // Future: return actual form input component based on field type
  // For now, return null to use placeholder
  return null
}

// Custom styles from advanced config
const customStyles = computed(() => {
  if (props.config.advanced?.customCSS) {
    // In a real implementation, this would be scoped/sandboxed
    return {}
  }
  return {}
})
</script>

<style lang="scss" scoped>
.form-preview {
  width: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-m);
}

.preview-form {
  :deep(.el-form-item) {
    margin-bottom: var(--app-space-m);
  }
  
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.form-fields-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--app-space-m);
}

.form-field-wrapper {
  min-width: 0;
}

.field-input-placeholder {
  width: 100%;
}

.placeholder-content {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-placeholder);
  font-size: var(--app-font-size-s);
  min-height: 32px;
}

.form-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl);
  gap: var(--app-space-s);
  color: var(--el-text-color-placeholder);

  .hint {
    font-size: var(--app-font-size-s);
  }
}

.form-actions-preview {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-l);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--el-border-color-lighter);
}

// Layout variations
.layout-single {
  .form-fields-grid {
    gap: var(--app-space-m);
  }
}

.layout-multi {
  .form-fields-grid {
    gap: var(--app-space-m) var(--app-space-l);
  }
}

.label-left {
  :deep(.el-form-item__label) {
    justify-content: flex-start;
  }
}
</style>
