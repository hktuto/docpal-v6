<template>
  <div class="form-view-editor">
    <!-- Header Toolbar -->
    <div class="editor-header">
      <div class="header-left">
        <h3>Form Configuration</h3>
        <span class="field-count">{{ visibleFields.length }} fields</span>
      </div>
      
      <div class="header-actions">
        <!-- Add Field Dropdown -->
        <el-dropdown @command="handleAddField" trigger="click">
          <el-button type="primary" size="small">
            <Icon name="lucide:plus" size="14" />
            Add Field
            <Icon name="lucide:chevron-down" size="14" class="dropdown-icon" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="add-field-menu">
              <el-dropdown-item
                v-for="field in availableFields"
                :key="field.fieldName"
                :command="field.fieldName"
              >
                <div class="dropdown-field-item">
                  <span class="field-name">{{ field.fieldNameAlias }}</span>
                  <span class="field-type">{{ getFieldTypeName(field.type) }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item v-if="availableFields.length === 0" disabled>
                <span class="no-fields">No more fields available</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- Settings Button -->
        <el-button size="small" @click="showSettings = true">
          <Icon name="lucide:settings" size="14" />
          Settings
        </el-button>

        <el-button size="small" @click="resetToDefault">
          <Icon name="lucide:rotate-ccw" size="14" />
          Reset
        </el-button>

        <el-button
          size="small"
          :type="showAdvanced ? 'primary' : 'default'"
          @click="showAdvanced = !showAdvanced"
        >
          <Icon name="lucide:code" size="14" />
          Advanced
        </el-button>

        <el-divider direction="vertical" />

        <el-button size="small" @click="handleCancel">Cancel</el-button>
        <el-button type="primary" size="small" @click="handleSave">
          Save
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="editor-content">
      <!-- Left: Large Form Preview -->
      <div class="preview-section">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="preview-header">
              <div class="preview-title">
                <Icon name="lucide:eye" size="16" />
                <span>Form Preview</span>
              </div>
              <div class="preview-actions">
                <el-radio-group v-model="localConfig.layout" size="small">
                  <el-radio-button label="single">
                    <Icon name="lucide:align-justify" size="12" />
                  </el-radio-button>
                  <el-radio-button label="multi">
                    <Icon name="lucide:columns-2" size="12" />
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>

          <div class="preview-container">
            <FormPreview
              :config="localConfig"
              :fields="fields"
              :sample-data="sampleData"
            />
          </div>
        </el-card>

        <!-- Advanced Settings Panel -->
        <el-card v-if="showAdvanced" class="advanced-card" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:code" size="16" />
              <span>Advanced Settings</span>
            </div>
          </template>

          <el-form label-position="top" size="small">
            <el-form-item label="Custom CSS">
              <el-input
                v-model="localAdvanced.customCSS"
                type="textarea"
                :rows="4"
                placeholder=".form-container { /* your styles */ }"
              />
            </el-form-item>

            <el-form-item label="Custom JavaScript">
              <el-input
                v-model="localAdvanced.customJS"
                type="textarea"
                :rows="4"
                placeholder="// Custom logic for form behavior"
              />
            </el-form-item>

            <el-form-item label="Custom Template">
              <el-input
                v-model="localAdvanced.template"
                type="textarea"
                :rows="4"
                placeholder="<div class='custom-form'>...</div>"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- Right: Field List -->
      <div class="fields-section">
        <el-card class="fields-card" shadow="never">
          <template #header>
            <div class="section-header">
              <Icon name="lucide:list" size="16" />
              <span>Fields</span>
              <span class="field-count-badge">{{ localConfig.fields.length }}</span>
            </div>
          </template>

          <!-- Selected Fields (Draggable) -->
          <div class="selected-fields">
            <div v-if="localConfig.fields.length === 0" class="empty-fields">
              <Icon name="lucide:layers" size="32" />
              <span>No fields configured</span>
              <span class="hint">Click "Add Field" to add fields to the form</span>
            </div>

            <draggable
              v-else
              v-model="localConfig.fields"
              item-key="fieldName"
              handle=".drag-handle"
              ghost-class="ghost"
            >
              <template #item="{ element }">
                <div class="field-item" :class="{ 'is-hidden': element.hidden }">
                  <div class="drag-handle">
                    <Icon name="lucide:grip-vertical" size="14" />
                  </div>
                  
                  <div class="field-info">
                    <span class="field-label">{{ getFieldLabel(element.fieldName) }}</span>
                    <span class="field-name">{{ element.fieldName }}</span>
                  </div>

                  <div class="field-badges">
                    <el-tag v-if="element.required" size="small" type="danger" effect="plain">
                      Required
                    </el-tag>
                    <el-tag v-if="element.hidden" size="small" type="warning" effect="plain">
                      Hidden
                    </el-tag>
                  </div>

                  <div class="field-controls">
                    <!-- Field Actions Dropdown -->
                    <el-dropdown trigger="click" @command="(cmd) => handleFieldAction(cmd, element)">
                      <el-button text size="small">
                        <Icon name="lucide:more-vertical" size="14" />
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="toggleRequired">
                            <Icon :name="element.required ? 'lucide:asterisk-off' : 'lucide:asterisk'" size="14" />
                            {{ element.required ? 'Remove Required' : 'Make Required' }}
                          </el-dropdown-item>
                          <el-dropdown-item command="toggleHidden">
                            <Icon :name="element.hidden ? 'lucide:eye' : 'lucide:eye-off'" size="14" />
                            {{ element.hidden ? 'Show Field' : 'Hide Field' }}
                          </el-dropdown-item>
                          <el-dropdown-item command="editLabel">
                            <Icon name="lucide:edit" size="14" />
                            Edit Label
                          </el-dropdown-item>
                          <el-dropdown-item divided command="remove">
                            <Icon name="lucide:trash-2" size="14" class="text-danger" />
                            <span class="text-danger">Remove</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Settings Dialog -->
    <el-dialog
      v-model="showSettings"
      title="Form Settings"
      width="500px"
      :close-on-click-modal="true"
    >
      <el-form label-position="top" size="default">
        <el-form-item label="Form Layout">
          <el-radio-group v-model="localConfig.layout">
            <el-radio-button label="single">Single Column</el-radio-button>
            <el-radio-button label="multi">Multi Column</el-radio-button>
          </el-radio-group>
          <div class="setting-hint">Controls how fields are arranged in the form</div>
        </el-form-item>

        <el-form-item label="Label Position">
          <el-radio-group v-model="localConfig.labelPosition">
            <el-radio-button label="top">Top</el-radio-button>
            <el-radio-button label="left">Left</el-radio-button>
          </el-radio-group>
          <div class="setting-hint">Position of field labels relative to inputs</div>
        </el-form-item>

        <el-form-item v-if="localConfig.labelPosition === 'left'" label="Label Width (px)">
          <el-slider v-model="localConfig.labelWidth" :min="80" :max="200" :step="10" show-stops />
          <div class="slider-value">{{ localConfig.labelWidth }}px</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSettings = false">Close</el-button>
      </template>
    </el-dialog>

    <!-- Edit Label Dialog -->
    <el-dialog
      v-model="showEditLabel"
      title="Edit Field Label"
      width="400px"
    >
      <el-form label-position="top" size="default">
        <el-form-item label="Custom Label (leave empty to use default)">
          <el-input
            v-model="editingFieldLabel"
            placeholder="Enter custom label"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditLabel = false">Cancel</el-button>
        <el-button type="primary" @click="saveFieldLabel">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import type { FormViewConfig, ViewFieldConfig, FieldInfo, AdvancedConfig } from '../../types/view-config'
import { generateDefaultFormConfig } from '../../types/view-config'
import FormPreview from './FormPreview.vue'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  /** Current form configuration */
  modelValue?: FormViewConfig
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Sample data for preview */
  sampleData?: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [config: FormViewConfig]
  save: [config: FormViewConfig]
  cancel: []
}>()

// UI State
const showAdvanced = ref(false)
const showSettings = ref(false)
const showEditLabel = ref(false)
const editingField = ref<ViewFieldConfig | null>(null)
const editingFieldLabel = ref('')

// Local config state
const localConfig = ref<FormViewConfig>({
  fields: [],
  layout: 'multi',
  labelPosition: 'top',
  labelWidth: 120
})

// Local advanced settings
const localAdvanced = ref<AdvancedConfig>({})

// Computed
const visibleFields = computed(() => {
  return localConfig.value.fields.filter(f => !f.hidden)
})

const availableFields = computed(() => {
  const selectedNames = new Set(localConfig.value.fields.map(f => f.fieldName))
  return props.fields.filter(f => !selectedNames.has(f.fieldName) && !f.isSystem)
})

// Initialize from props
onMounted(() => {
  initializeConfig()
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localConfig.value = JSON.parse(JSON.stringify(newValue))
    localAdvanced.value = { ...newValue.advanced } || {}
  }
}, { deep: true })

// Watch for fields changes to auto-generate if empty
watch(() => props.fields, (newFields) => {
  if (newFields.length > 0 && localConfig.value.fields.length === 0 && !props.modelValue) {
    resetToDefault()
  }
}, { immediate: true })

// Sync advanced settings to config
watch(localAdvanced, (newValue) => {
  const hasAdvanced = newValue.customCSS || newValue.customJS || newValue.template
  localConfig.value.advanced = hasAdvanced ? { ...newValue } : undefined
}, { deep: true })

function initializeConfig() {
  if (props.modelValue) {
    localConfig.value = JSON.parse(JSON.stringify(props.modelValue))
    localAdvanced.value = { ...props.modelValue.advanced } || {}
  } else if (props.fields.length > 0) {
    resetToDefault()
  }
}

function generateDefaultConfig(): FormViewConfig {
  return generateDefaultFormConfig(props.fields)
}

function resetToDefault() {
  localConfig.value = generateDefaultConfig()
  localAdvanced.value = {}
}

function handleAddField(fieldName: string) {
  if (!fieldName) return
  
  localConfig.value.fields.push({
    fieldName,
    colSpan: 12,
    required: false
  })
}

function handleFieldAction(command: string, field: ViewFieldConfig) {
  switch (command) {
    case 'toggleRequired':
      field.required = !field.required
      break
    case 'toggleHidden':
      field.hidden = !field.hidden
      break
    case 'editLabel':
      editingField.value = field
      editingFieldLabel.value = field.label || ''
      showEditLabel.value = true
      break
    case 'remove':
      localConfig.value.fields = localConfig.value.fields.filter(f => f.fieldName !== field.fieldName)
      break
  }
}

function saveFieldLabel() {
  if (editingField.value) {
    editingField.value.label = editingFieldLabel.value || undefined
  }
  showEditLabel.value = false
}

function getFieldLabel(fieldName: string): string {
  const field = props.fields.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

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

function handleSave() {
  emit('update:modelValue', localConfig.value)
  emit('save', localConfig.value)
}

function handleCancel() {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.form-view-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
}

.field-count {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: var(--el-border-radius-small);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);

  .dropdown-icon {
    margin-left: 4px;
  }
}

// Add Field Dropdown
.add-field-menu {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: var(--app-space-m);

  .field-name {
    font-weight: 500;
  }

  .field-type {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    padding: 2px 6px;
    border-radius: var(--el-border-radius-small);
  }
}

.no-fields {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

// Main Content Layout
.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  overflow: auto;
}

// Preview Section (Left - Main)
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  min-height: 0;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    flex: 1;
    padding: var(--app-space-m);
    overflow: auto;
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
}

.preview-actions {
  display: flex;
  gap: var(--app-space-s);
}

.preview-container {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-m);
  min-height: 400px;
}

// Fields Section (Right - Sidebar)
.fields-section {
  display: flex;
  flex-direction: column;
}

.fields-card {
  height: 100%;

  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: 0;
    height: calc(100% - 50px);
    overflow: auto;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
}

.field-count-badge {
  margin-left: auto;
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: var(--el-border-radius-small);
}

// Selected Fields List
.selected-fields {
  padding: var(--app-space-s);
}

.empty-fields {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl) var(--app-space-m);
  gap: var(--app-space-s);
  color: var(--el-text-color-placeholder);
  text-align: center;

  .hint {
    font-size: var(--app-font-size-s);
  }
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-small);
  margin-bottom: var(--app-space-xs);
  transition: all 0.2s;
  cursor: pointer;

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

    .field-label {
      text-decoration: line-through;
    }
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

.field-badges {
  display: flex;
  gap: 4px;
}

.field-controls {
  display: flex;
  align-items: center;
}

.ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9);
}

// Advanced Card
.advanced-card {
  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: var(--app-space-m);
  }
}

// Settings Dialog
.setting-hint {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.slider-value {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}

// Responsive
@media (max-width: 900px) {
  .editor-content {
    grid-template-columns: 1fr;
  }

  .fields-section {
    order: -1;
    max-height: 300px;
  }
}
</style>
