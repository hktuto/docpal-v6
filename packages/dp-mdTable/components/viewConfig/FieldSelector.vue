<template>
  <div class="field-selector">
    <!-- Selected Fields List (Draggable) -->
    <div class="selected-fields">
      <div class="section-header">
        <span class="section-title">Selected Fields</span>
        <span class="field-count">{{ selectedFields.length }} fields</span>
      </div>
      
      <div v-if="selectedFields.length === 0" class="empty-state">
        <Icon name="lucide:layers" size="24" />
        <span>No fields selected</span>
        <span class="hint">Add fields from the list below</span>
      </div>

      <draggable
        v-else
        v-model="selectedFields"
        item-key="fieldName"
        handle=".drag-handle"
        ghost-class="ghost"
        @end="handleDragEnd"
      >
        <template #item="{ element, index }">
          <div class="field-item" :class="{ 'is-hidden': element.hidden }">
            <div class="drag-handle">
              <Icon name="lucide:grip-vertical" size="14" />
            </div>
            
            <div class="field-info">
              <span class="field-label">{{ getFieldLabel(element.fieldName) }}</span>
              <span class="field-name">{{ element.fieldName }}</span>
            </div>

            <div class="field-controls">
              <!-- Hidden Toggle -->
              <el-tooltip v-if="showHidden" content="Hidden field" placement="top">
                <el-button
                  text
                  size="small"
                  :type="element.hidden ? 'warning' : 'default'"
                  @click="toggleHidden(element)"
                >
                  <Icon :name="element.hidden ? 'lucide:eye-off' : 'lucide:eye'" size="14" />
                </el-button>
              </el-tooltip>

              <!-- Required Toggle -->
              <el-tooltip v-if="showRequired" content="Required field" placement="top">
                <el-button
                  text
                  size="small"
                  :type="element.required ? 'primary' : 'default'"
                  @click="toggleRequired(element)"
                >
                  <Icon name="lucide:asterisk" size="14" />
                </el-button>
              </el-tooltip>

              <!-- Column Span Selector -->
              <el-select
                v-model="element.colSpan"
                size="small"
                style="width: 70px"
                @change="handleFieldUpdate(element)"
              >
                <el-option
                  v-for="span in colSpanOptions"
                  :key="span.value"
                  :label="span.label"
                  :value="span.value"
                />
              </el-select>

              <!-- Advanced Button -->
              <el-tooltip content="Advanced settings" placement="top">
                <el-button
                  text
                  size="small"
                  :type="element.advanced ? 'primary' : 'default'"
                  @click="openFieldAdvanced(element)"
                >
                  <Icon name="lucide:code" size="14" />
                </el-button>
              </el-tooltip>

              <!-- Remove Button -->
              <el-button
                text
                type="danger"
                size="small"
                @click="removeField(element.fieldName)"
              >
                <Icon name="lucide:x" size="14" />
              </el-button>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Available Fields -->
    <div class="available-fields">
      <div class="section-header">
        <span class="section-title">Available Fields</span>
      </div>

      <div class="add-field-section">
        <el-select
          v-model="fieldToAdd"
          placeholder="Add a field..."
          style="width: 100%"
          filterable
          :disabled="availableFields.length === 0"
          @change="handleAddField"
        >
          <el-option
            v-for="field in availableFields"
            :key="field.fieldName"
            :label="field.fieldNameAlias || field.fieldName"
            :value="field.fieldName"
          >
            <div class="field-option">
              <span>{{ field.fieldNameAlias || field.fieldName }}</span>
              <span class="field-type-badge">{{ getFieldTypeName(field.type) }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
    </div>

    <!-- Field Advanced Settings Dialog -->
    <el-dialog
      v-model="showAdvancedDialog"
      title="Field Advanced Settings"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="editingField" class="advanced-settings">
        <el-form label-position="top">
          <el-form-item label="Label Override">
            <el-input
              v-model="editingField.label"
              placeholder="Use default field label"
            />
          </el-form-item>

          <el-form-item label="Custom CSS">
            <el-input
              v-model="editingFieldAdvanced.customCSS"
              type="textarea"
              :rows="4"
              placeholder=".field-wrapper { /* your styles */ }"
            />
          </el-form-item>

          <el-form-item label="Custom JavaScript">
            <el-input
              v-model="editingFieldAdvanced.customJS"
              type="textarea"
              :rows="4"
              placeholder="// Format or transform the value"
            />
          </el-form-item>

          <el-form-item label="Custom Template">
            <el-input
              v-model="editingFieldAdvanced.template"
              type="textarea"
              :rows="4"
              placeholder="<div>{{ value }}</div>"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showAdvancedDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveFieldAdvanced">
          Save
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import type { ViewFieldConfig, FieldInfo, AdvancedConfig } from '../../types/view-config'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Currently selected fields */
  modelValue: ViewFieldConfig[]
  /** All available fields from the table */
  fields: FieldInfo[]
  /** Show required toggle for form fields */
  showRequired?: boolean
  /** Show hidden toggle */
  showHidden?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [fields: ViewFieldConfig[]]
}>()

// Local state for draggable
const selectedFields = ref<ViewFieldConfig[]>([...props.modelValue])

// Sync with prop changes
watch(() => props.modelValue, (newValue) => {
  selectedFields.value = [...newValue]
}, { deep: true })

// Emit changes
watch(selectedFields, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// Field to add dropdown
const fieldToAdd = ref<string>('')

// Column span options
const colSpanOptions = [
  { value: 3, label: '1/4' },
  { value: 4, label: '1/3' },
  { value: 6, label: '1/2' },
  { value: 8, label: '2/3' },
  { value: 12, label: 'Full' }
]

// Advanced dialog state
const showAdvancedDialog = ref(false)
const editingField = ref<ViewFieldConfig | null>(null)
const editingFieldAdvanced = ref<AdvancedConfig>({})

// Available fields (not already selected)
const availableFields = computed(() => {
  const selectedNames = new Set(selectedFields.value.map(f => f.fieldName))
  return props.fields.filter(f => !selectedNames.has(f.fieldName) && !f.isSystem)
})

// Get field label from fieldInfo
function getFieldLabel(fieldName: string): string {
  const field = props.fields.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

// Get field type name
function getFieldTypeName(type: number): string {
  const typeNames: Record<number, string> = {
    [ColumnFieldType.Text]: 'Text',
    [ColumnFieldType.MultiText]: 'Long Text',
    [ColumnFieldType.Number]: 'Number',
    [ColumnFieldType.SingleSelect]: 'Select',
    [ColumnFieldType.MultiSelect]: 'Multi-Select',
    [ColumnFieldType.DateTime]: 'Date',
    [ColumnFieldType.Checkbox]: 'Checkbox',
    [ColumnFieldType.Rating]: 'Rating',
    [ColumnFieldType.Email]: 'Email',
    [ColumnFieldType.URL]: 'URL',
    [ColumnFieldType.Phone]: 'Phone',
    [ColumnFieldType.Member]: 'Member',
    [ColumnFieldType.Attachment]: 'Attachment',
    [ColumnFieldType.MagicLink]: 'Relation',
    [ColumnFieldType.Formula]: 'Formula',
    [ColumnFieldType.Currency]: 'Currency',
    [ColumnFieldType.Percent]: 'Percent'
  }
  return typeNames[type] || 'Field'
}

// Handle adding a field
function handleAddField(fieldName: string) {
  if (!fieldName) return
  
  selectedFields.value.push({
    fieldName,
    colSpan: 6 // Default to half width
  })
  
  fieldToAdd.value = ''
}

// Remove a field
function removeField(fieldName: string) {
  selectedFields.value = selectedFields.value.filter(f => f.fieldName !== fieldName)
}

// Handle field update
function handleFieldUpdate(field: ViewFieldConfig) {
  // Trigger reactivity
  selectedFields.value = [...selectedFields.value]
}

// Handle drag end
function handleDragEnd() {
  // Reactivity already handled by v-model
}

// Open advanced settings for a field
function openFieldAdvanced(field: ViewFieldConfig) {
  editingField.value = field
  editingFieldAdvanced.value = { ...field.advanced } || {}
  showAdvancedDialog.value = true
}

// Toggle required state
function toggleRequired(field: ViewFieldConfig) {
  field.required = !field.required
  selectedFields.value = [...selectedFields.value]
}

// Toggle hidden state
function toggleHidden(field: ViewFieldConfig) {
  field.hidden = !field.hidden
  selectedFields.value = [...selectedFields.value]
}

// Save field advanced settings
function saveFieldAdvanced() {
  if (editingField.value) {
    const hasAdvanced = 
      editingFieldAdvanced.value.customCSS || 
      editingFieldAdvanced.value.customJS || 
      editingFieldAdvanced.value.template

    editingField.value.advanced = hasAdvanced ? { ...editingFieldAdvanced.value } : undefined
    
    // Trigger reactivity
    selectedFields.value = [...selectedFields.value]
  }
  showAdvancedDialog.value = false
}
</script>

<style lang="scss" scoped>
.field-selector {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-s);
}

.section-title {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.field-count {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
}

.selected-fields {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-s);
  background: var(--el-fill-color-blank);
  min-height: 150px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-l);
  gap: var(--app-space-xs);
  color: var(--el-text-color-placeholder);

  .hint {
    font-size: var(--app-font-size-xs);
  }
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs) var(--app-space-s);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
  margin-bottom: var(--app-space-xs);
  transition: all 0.2s;
  opacity: 1;

  &:hover {
    border-color: var(--el-border-color);
    background: var(--el-fill-color);
  }

  &:last-child {
    margin-bottom: 0;
  }

  &.is-hidden {
    opacity: 0.6;
    border-style: dashed;
  }
}

.drag-handle {
  cursor: grab;
  color: var(--el-text-color-placeholder);
  display: flex;
  align-items: center;
  padding: 4px;

  &:active {
    cursor: grabbing;
  }
}

.field-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-name {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.field-controls {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9);
}

.available-fields {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-s);
  background: var(--el-fill-color-lighter);
}

.add-field-section {
  margin-top: var(--app-space-xs);
}

.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.field-type-badge {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: var(--el-border-radius-small);
}

.advanced-settings {
  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-textarea__inner) {
    font-family: monospace;
    font-size: var(--app-font-size-s);
  }
}
</style>
