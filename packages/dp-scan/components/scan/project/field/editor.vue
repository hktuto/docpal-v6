<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { Field, FieldType, NormalizeOptions } from '../../../../types/formOCR'

const modelValue = defineModel<Field>('modelValue', {
  required: true
})

const fieldTypeOptions: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Select', value: 'select' },
  { label: 'Date', value: 'date' },
  { label: 'HKID', value: 'hkic' },
  { label: 'Number', value: 'number' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Radio', value: 'radio' }
]

const localValue = computed({
  get: () => modelValue.value,
  set: (value) => {
    modelValue.value = value
  }
})

/** Whether this field type has options (select, radio) */
const hasOptions = computed(() => {
  return ['select', 'radio'].includes(localValue.value.type)
})

/** Whether this field type has date format (date) */
const isDateType = computed(() => {
  return localValue.value.type === 'date'
})

/** Get label for field type */
function getFieldTypeLabel(type: FieldType): string {
  const option = fieldTypeOptions.find(opt => opt.value === type)
  return option?.label || type
}

// ==================== Options Handling ====================

interface OptionRow {
  key: string
  value: string
}

// Local editable rows for options
const optionRows = ref<OptionRow[]>([])

// Convert from field format [{"Y": "Y"}, {"N": "N"}] to editable rows
function loadOptionsFromField() {
  const opts = localValue.value.field_setting?.options
  if (!opts || opts.length === 0) {
    optionRows.value = []
    return
  }

  optionRows.value = opts.map((opt: Record<string, string>) => {
    const entries = Object.entries(opt)
    if (entries.length === 0) return { key: '', value: '' }
    const [key, value] = entries[0]
    return { key, value }
  })
}

// Convert from editable rows to field format [{"Y": "Y"}, {"N": "N"}]
function saveOptionsToField() {
  if (!localValue.value.field_setting) {
    localValue.value.field_setting = {}
  }

  localValue.value.field_setting.options = optionRows.value
    .filter(row => row.key.trim() !== '')
    .map(row => ({
      [row.key.trim()]: row.value.trim() || row.key.trim()
    }))
}

// Watch for external changes to options
watch(() => localValue.value.field_setting?.options, loadOptionsFromField, { immediate: true })

// Watch for type changes - clear options when switching away from select/radio
watch(() => localValue.value.type, (newType) => {
  if (!['select', 'radio'].includes(newType)) {
    optionRows.value = []
    if (localValue.value.field_setting) {
      localValue.value.field_setting.options = []
    }
    // Clear normalize options too
    localValue.value.normalize_options = undefined
  }
})

function addOptionRow() {
  optionRows.value.push({ key: '', value: '' })
}

function removeOptionRow(index: number) {
  optionRows.value.splice(index, 1)
  saveOptionsToField()
  // Also remove from normalize options
  syncNormalizeOptionsFromFieldOptions()
}

function updateOptionRow() {
  saveOptionsToField()
  syncNormalizeOptionsFromFieldOptions()
}

// ==================== Normalize Options Handling ====================

interface NormalizeRow {
  targetValue: string
  patterns: string  // Comma-separated or newline-separated
}

const normalizeRows = ref<NormalizeRow[]>([])
const showNormalizeSection = ref(false)

// Load normalize_options into editable rows
function loadNormalizeOptions() {
  const opts = localValue.value.normalize_options
  if (!opts || Object.keys(opts).length === 0) {
    normalizeRows.value = []
    return
  }

  normalizeRows.value = Object.entries(opts).map(([targetValue, patterns]) => ({
    targetValue,
    patterns: Array.isArray(patterns) ? patterns.join(', ') : String(patterns)
  }))
}

// Save normalize_rows back to normalize_options
function saveNormalizeOptions() {
  const result: NormalizeOptions = {}

  for (const row of normalizeRows.value) {
    if (row.targetValue.trim()) {
      // Split by comma or newline, trim each pattern
      const patterns = row.patterns
        .split(/[,\n]/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

      if (patterns.length > 0) {
        result[row.targetValue.trim()] = patterns
      }
    }
  }

  localValue.value.normalize_options = Object.keys(result).length > 0 ? result : undefined
}

// Auto-generate normalize_options from field options
function syncNormalizeOptionsFromFieldOptions() {
  // Only auto-generate if normalize_options is empty
  if (!localValue.value.normalize_options || Object.keys(localValue.value.normalize_options).length === 0) {
    const opts: NormalizeOptions = {}

    for (const row of optionRows.value) {
      if (row.key.trim()) {
        const key = row.key.trim()
        const label = row.value.trim() || key

        // Create patterns: exact match for key and label (case variations)
        opts[key] = [
          key,
          key.toLowerCase(),
          key.toUpperCase()
        ]

        // Also add label variations if different from key
        if (label !== key) {
          opts[key].push(label, label.toLowerCase(), label.toUpperCase())
        }
      }
    }

    if (Object.keys(opts).length > 0) {
      localValue.value.normalize_options = opts
      loadNormalizeOptions()
    }
  }
}

function addNormalizeRow() {
  normalizeRows.value.push({ targetValue: '', patterns: '' })
}

function removeNormalizeRow(index: number) {
  normalizeRows.value.splice(index, 1)
  saveNormalizeOptions()
}

function updateNormalizeRow() {
  saveNormalizeOptions()
}

// Watch for external changes
watch(() => localValue.value.normalize_options, loadNormalizeOptions, { immediate: true })

// Initialize normalize options from field options when section opens
watch(() => showNormalizeSection.value, (show) => {
  if (show && normalizeRows.value.length === 0) {
    syncNormalizeOptionsFromFieldOptions()
  }
})

// ==================== Validation Function ====================

const showValidationSection = ref(false)
const validationCode = computed({
  get: () => localValue.value.validation_function || '',
  set: (val) => {
    localValue.value.validation_function = val.trim() || undefined
  }
})

const validationPlaceholder = `// Example: Validate ID with other field
// (rule, value, callback, allData) => {
//   if (!value) {
//     callback(new Error('ID is required'))
//     return
//   }
//   // Check against another field
//   if (allData?.otherField === 'someValue' && value.length < 5) {
//     callback(new Error('ID must be at least 5 characters'))
//     return
//   }
//   callback() // Valid
// }`
</script>

<template>
  <div class="field-editor">
    <ElForm label-position="top" size="small">
      <!-- Row 1: Label and Type -->
      <ElRow :gutter="12">
        <ElCol :span="16">
          <ElFormItem label="Label" required>

            <ElInput v-model="localValue.lable" placeholder="Field label" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="Type">
            <ElSelect v-model="localValue.type" class="w-full">
              <ElOption
                v-for="opt in fieldTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- Row 2: Export Label and Date Format -->
      <ElRow :gutter="12">
        <ElCol :span="isDateType ? 12 : 24">
          <ElFormItem label="Export Label">
            <ElInput v-model="localValue.export_label" placeholder="Column name" />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isDateType" :span="12">
          <ElFormItem label="Date Format">
            <ElInput v-model="localValue.format" placeholder="DD/MM/YYYY" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- Row 3: Checkboxes -->
      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem>
            <ElCheckbox v-model="localValue.need_ocr">Need OCR</ElCheckbox>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem>
            <ElCheckbox v-model="localValue.required">Required</ElCheckbox>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- Row 4: Options for select/radio -->
      <ElFormItem v-if="hasOptions" label="Options">
        <div class="options-list">
          <div v-for="(row, index) in optionRows" :key="index" class="option-row">
            <ElInput
              v-model="row.key"
              placeholder="Value"
              size="small"
              @change="updateOptionRow"
            />
            <ElInput
              v-model="row.value"
              placeholder="Label"
              size="small"
              @change="updateOptionRow"
            />
            <ElButton
              type="danger"
              size="small"
              circle
              @click="removeOptionRow(index)"
            >
              <Icon name="lucide:x" />
            </ElButton>
          </div>
          <ElButton type="primary" size="small" @click="addOptionRow">
            <Icon name="lucide:plus" />
            Add Option
          </ElButton>
        </div>
      </ElFormItem>

      <!-- Row 5: Normalize Options (for select/radio) -->
      <template v-if="hasOptions">
        <div class="section-header" @click="showNormalizeSection = !showNormalizeSection">
          <span>Normalize Options</span>
          <ElTag v-if="localValue.normalize_options && Object.keys(localValue.normalize_options).length > 0"
                 size="small" type="success">
            {{ Object.keys(localValue.normalize_options).length }} mappings
          </ElTag>
          <Icon :name="showNormalizeSection ? 'lucide:chevron-down' : 'lucide:chevron-right'" />
        </div>

        <div v-show="showNormalizeSection" class="normalize-section">
          <ElAlert type="info" :closable="false" class="normalize-hint">
            Map input values (OCR) to option values. Supports regex patterns (e.g., <code>^[Yy]$</code>).
          </ElAlert>

          <div class="normalize-list">
            <div v-for="(row, index) in normalizeRows" :key="index" class="normalize-row">
              <ElInput
                v-model="row.targetValue"
                placeholder="Target Value"
                size="small"
                @change="updateNormalizeRow"
              />
              <ElInput
                v-model="row.patterns"
                placeholder="Patterns: Yes, Y, ^[Yy]$"
                size="small"
                @change="updateNormalizeRow"
              />
              <ElButton
                type="danger"
                size="small"
                circle
                @click="removeNormalizeRow(index)"
              >
                <Icon name="lucide:x" />
              </ElButton>
            </div>
            <ElButton type="primary" size="small" @click="addNormalizeRow">
              <Icon name="lucide:plus" />
              Add Mapping
            </ElButton>
          </div>
        </div>
      </template>

      <!-- Row 6: Validation Function -->
      <div class="section-header" @click="showValidationSection = !showValidationSection">
        <span>Custom Validation</span>
        <ElTag v-if="localValue.validation_function" size="small" type="success">Configured</ElTag>
        <Icon :name="showValidationSection ? 'lucide:chevron-down' : 'lucide:chevron-right'" />
      </div>

      <div v-show="showValidationSection" class="validation-section">
        <ElAlert type="info" :closable="false" class="validation-hint">
          Function signature: <code>(rule, value, callback, allData) => { ... }</code>
        </ElAlert>

        <ElInput
          v-model="validationCode"
          type="textarea"
          :rows="6"
          :placeholder="validationPlaceholder"
          class="validation-code"
        />
      </div>
    </ElForm>
  </div>
</template>

<style scoped>
.field-editor {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.w-full {
  width: 100%;
}

.options-list,
.normalize-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row,
.normalize-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin-top: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #606266;
  border-top: 1px dashed #dcdfe6;
}

.section-header:hover {
  color: #409eff;
}

.normalize-section,
.validation-section {
  padding: 8px 0;
}

.normalize-hint,
.validation-hint {
  margin-bottom: 12px;
}

.normalize-hint code,
.validation-hint code {
  background: #f4f4f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
}

.validation-code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
