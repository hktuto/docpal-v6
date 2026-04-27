<template>
  <div
    class="form-renderer"
    :class="{
      'layout-single': config.layout === 'single',
      'layout-multi': config.layout === 'multi',
      'label-top': config.labelPosition === 'top',
      'label-left': config.labelPosition === 'left'
    }"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :label-position="config.labelPosition"
      :label-width="config.labelPosition === 'left' ? `${config.labelWidth}px` : undefined"
      class="dynamic-form"
      @submit.prevent
    >
      <div class="form-fields-grid">aaa
        <template v-for="field in visibleFields" :key="field.fieldName">
          <div class="form-field-wrapper" :style="getFieldStyle(field)">
            <el-form-item :label="getFieldLabel(field)" :prop="field.fieldName"  class="dynamic-form-item">
              <!-- Text Input -->
              <template v-if="getFieldType(field.fieldName) === ColumnFieldType.Text">aa
                <el-input v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" clearable />
              </template>

              <!-- Multi-line Text -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.MultiText">bb
                <el-input v-model="formData[field.fieldName]" type="textarea" :rows="3" :placeholder="getFieldPlaceholder(field.fieldName)" />
              </template>

              <!-- Number -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Number">cc
                <el-input-number v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" style="width: 100%" />
              </template>

              <!-- Single Select -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.SingleSelect">
                <el-select v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" clearable style="width: 100%">
                  <el-option v-for="option in getFieldOptions(field.fieldName)" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>

              <!-- Multi Select -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.MultiSelect">
                <el-select v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" multiple clearable style="width: 100%">
                  <el-option v-for="option in getFieldOptions(field.fieldName)" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>

              <!-- DateTime -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.DateTime">
                <el-date-picker v-model="formData[field.fieldName]" type="datetime" :placeholder="getFieldPlaceholder(field.fieldName)" style="width: 100%" />
              </template>

              <!-- Checkbox -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Checkbox">
                <el-checkbox v-model="formData[field.fieldName]">
                  {{ getFieldCheckboxLabel(field.fieldName) }}
                </el-checkbox>
              </template>

              <!-- Rating -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Rating">
                <el-rate v-model="formData[field.fieldName]" :max="5" />
              </template>

              <!-- Email -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Email">
                <el-input v-model="formData[field.fieldName]" type="email" :placeholder="getFieldPlaceholder(field.fieldName)" clearable>
                  <template #prefix>
                    <Icon name="lucide:mail" size="14" />
                  </template>
                </el-input>
              </template>

              <!-- URL -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.URL">
                <el-input v-model="formData[field.fieldName]" type="url" :placeholder="getFieldPlaceholder(field.fieldName)" clearable>
                  <template #prefix>
                    <Icon name="lucide:link" size="14" />
                  </template>
                </el-input>
              </template>

              <!-- Phone -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Phone">
                <el-input v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" clearable>
                  <template #prefix>
                    <Icon name="lucide:phone" size="14" />
                  </template>
                </el-input>
              </template>

              <!-- Currency -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Currency">
                <el-input-number
                  v-model="formData[field.fieldName]"
                  :precision="2"
                  :step="0.01"
                  :placeholder="getFieldPlaceholder(field.fieldName)"
                  style="width: 100%"
                />
              </template>

              <!-- Percent -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Percent">
                <el-input-number
                  v-model="formData[field.fieldName]"
                  :precision="2"
                  :step="0.01"
                  :min="0"
                  :max="1"
                  :placeholder="getFieldPlaceholder(field.fieldName)"
                  style="width: 100%"
                />
              </template>

              <!-- Member -->
              <template v-else-if="getFieldType(field.fieldName) === ColumnFieldType.Member">
                <el-select v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" clearable style="width: 100%">
                  <!-- Member options would be populated from workspace members -->
                  <el-option label="Current User" value="current" />
                </el-select>
              </template>

              <!-- Default fallback -->
              <template v-else>
                <el-input v-model="formData[field.fieldName]" :placeholder="getFieldPlaceholder(field.fieldName)" clearable />
              </template>
            </el-form-item>
          </div>
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="visibleFields.length === 0" class="form-empty">
        <Icon name="lucide:form-input" size="32" />
        <span>No form fields configured</span>
        <span class="hint">Please configure form fields in table settings</span>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { FormViewConfig, ViewFieldConfig, FieldInfo } from '../../types/view-config'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Form configuration */
  config: FormViewConfig
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Initial form data */
  modelValue?: Record<string, any>
  /** Whether the form is in edit mode */
  isEdit?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [data: Record<string, any>]
  submit: [data: Record<string, any>]
}>()

// Form reference
const formRef = ref<FormInstance>()

// Form data
const formData = ref<Record<string, any>>({})

// Initialize form data
onMounted(() => {
  initializeFormData()
})

// Watch for external data changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formData.value = { ...newValue }
    }
  },
  { deep: true }
)

// Initialize form data with defaults
function initializeFormData() {
  const initialData: Record<string, any> = {}

  props.config.fields.forEach((fieldConfig) => {
    const fieldInfo = getFieldInfo(fieldConfig.fieldName)
    if (!fieldInfo) return

    // Use provided value or default
    initialData[fieldConfig.fieldName] = props.modelValue?.[fieldConfig.fieldName] ?? getDefaultValue(fieldInfo.type)
  })

  formData.value = initialData
}

// Get default value based on field type
function getDefaultValue(type: number): any {
  switch (type) {
    case ColumnFieldType.Checkbox:
      return false
    case ColumnFieldType.MultiSelect:
      return []
    case ColumnFieldType.Number:
    case ColumnFieldType.Currency:
    case ColumnFieldType.Percent:
    case ColumnFieldType.Rating:
      return null
    case ColumnFieldType.DateTime:
      return null
    default:
      return ''
  }
}

// Filter visible fields (not hidden)
const visibleFields = computed(() => {
  return props.config.fields.filter((f) => !f.hidden)
})

// Generate form validation rules
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}

  visibleFields.value.forEach((fieldConfig) => {
    const fieldInfo = getFieldInfo(fieldConfig.fieldName)
    const fieldType = fieldInfo?.type
    const fieldRules: any[] = []

    // Required validation
    if (fieldConfig.required) {
      const rule: any = {
        required: true,
        message: `${getFieldLabel(fieldConfig)} is required`,
        trigger: 'blur'
      }

      // Set type based on field type for proper validation
      if (fieldType === ColumnFieldType.MultiSelect) {
        rule.type = 'array'
        rule.trigger = 'change'
      } else if (fieldType === ColumnFieldType.Number || fieldType === ColumnFieldType.Rating) {
        rule.type = 'number'
      } else if (fieldType === ColumnFieldType.DateTime) {
        rule.type = 'date'
      }

      fieldRules.push(rule)
    }

    // Type-specific validation (even if not required, validate type when value exists)
    if (fieldType === ColumnFieldType.Number && !fieldConfig.required) {
      fieldRules.push({
        type: 'number',
        message: `${getFieldLabel(fieldConfig)} must be a number`,
        trigger: 'blur'
      })
    } else if (fieldType === ColumnFieldType.DateTime && !fieldConfig.required) {
      fieldRules.push({
        type: 'date',
        message: `${getFieldLabel(fieldConfig)} must be a valid date`,
        trigger: 'change'
      })
    }

    if (fieldRules.length > 0) {
      rules[fieldConfig.fieldName] = fieldRules
    }
  })

  return rules
})

// Get field info by name
function getFieldInfo(fieldName: string): FieldInfo | undefined {
  return props.fields.find((f) => f.fieldName === fieldName)
}

// Get field type
function getFieldType(fieldName: string): number {
  const fieldInfo = getFieldInfo(fieldName)
  return fieldInfo?.type || ColumnFieldType.Text
}

// Get field label
function getFieldLabel(fieldConfig: ViewFieldConfig): string {
  if (fieldConfig.label) return fieldConfig.label
  const fieldInfo = getFieldInfo(fieldConfig.fieldName)
  return fieldInfo?.fieldNameAlias || fieldConfig.fieldName
}

// Check if field is required
function isFieldRequired(fieldConfig: ViewFieldConfig): boolean {
  return fieldConfig.required === true
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

// Get field options for select fields
function getFieldOptions(fieldName: string): Array<{ label: string; value: string }> {
  const fieldInfo = getFieldInfo(fieldName)
  if (!fieldInfo?.properties?.options) return []

  return fieldInfo.properties.options.map((opt: any) => ({
    label: opt.label || opt.value,
    value: opt.value
  }))
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
    [ColumnFieldType.DateTime]: 'Select date and time',
    [ColumnFieldType.Rating]: 'Rate 1-5',
    [ColumnFieldType.Email]: 'Enter email address',
    [ColumnFieldType.URL]: 'Enter URL',
    [ColumnFieldType.Phone]: 'Enter phone number',
    [ColumnFieldType.Member]: 'Select member',
    [ColumnFieldType.Currency]: 'Enter amount',
    [ColumnFieldType.Percent]: 'Enter percentage (0-1)'
  }

  return placeholderMap[fieldInfo.type] || 'Enter value'
}

// Get checkbox label
function getFieldCheckboxLabel(fieldName: string): string {
  const fieldInfo = getFieldInfo(fieldName)
  return fieldInfo?.properties?.label || 'Yes'
}

// Validate and submit form
async function submitForm(): Promise<boolean> {
  if (!formRef.value) return false

  try {
    await formRef.value.validate()
    emit('submit', { ...formData.value })
    return true
  } catch (error) {
    return false
  }
}

// Reset form
function resetForm() {
  formRef.value?.resetFields()
  initializeFormData()
}

// Expose methods for parent component
defineExpose({
  submitForm,
  resetForm,
  formData: computed(() => formData.value),
  validate: async () => formRef.value?.validate()
})
</script>

<style lang="scss" scoped>
.form-renderer {
  width: 100%;
}

.dynamic-form {
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
  gap: var(--app-space-m) var(--app-space-l);
}

.form-field-wrapper {
  min-width: 0;
}

.dynamic-form-item {
  :deep(.el-form-item__content) {
    .el-input,
    .el-input-number,
    .el-select,
    .el-date-editor {
      width: 100%;
    }
  }
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
