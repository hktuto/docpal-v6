<script setup lang="ts">
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'

// Define local types to avoid import issues
interface AdvancedConfig {
  customCSS?: string
  customJS?: string
  template?: string
}

interface ViewFieldConfig {
  fieldName: string
  colSpan?: number
  label?: string
  hidden?: boolean
  advanced?: AdvancedConfig
}

interface CardViewConfig {
  fields: ViewFieldConfig[]
  titleField?: string
  subtitleField?: string
  coverField?: string
  advanced?: AdvancedConfig
}

interface FieldInfo {
  fieldName: string
  fieldNameAlias: string
  type: number
  isSystem?: boolean
}

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

// Table data
const tableData = ref<CaseTableRecord | null>(null)
const tableFields = ref<CaseFieldRecord[]>([])
const isLoading = ref(true)

// Current card configuration
const cardConfig = ref<CardViewConfig | undefined>(undefined)

// Convert CaseFieldRecord to FieldInfo for the editor
const fieldInfoList = computed<FieldInfo[]>(() => {
  return tableFields.value.map(field => ({
    fieldName: field.fieldName,
    fieldNameAlias: field.fieldNameAlias || field.fieldName,
    type: field.displayStructure?.type || 19, // Default to Text
    isSystem: field.isHidden || false,
    properties: field.displayStructure?.properties || {}
  }))
})

// Load table data and fields
async function loadTableData() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.itemType !== 'table' || !treeItem.itemId) {
    isLoading.value = false
    return
  }

  try {
    // Load table
    const tables = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [treeItem.itemId]
    )
    
    if (Array.isArray(tables) && tables.length > 0) {
      tableData.value = tables[0]
      
      // Load card config from formStructure
      if (tableData.value?.formStructure?.card) {
        cardConfig.value = tableData.value.formStructure.card as CardViewConfig
      }
    }

    // Load fields
    const fields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt"`,
      [treeItem.itemId]
    )
    tableFields.value = Array.isArray(fields) ? fields : []

  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  } finally {
    isLoading.value = false
  }
}

// Save card configuration
async function handleSaveCardConfig(config: CardViewConfig) {
  if (!tableData.value) return

  try {
    const now = new Date().toISOString()
    
    // Merge with existing formStructure
    const updatedFormStructure = {
      ...tableData.value.formStructure,
      card: config
    }

    await query(
      `UPDATE case_tables 
       SET "formStructure" = $1, "updatedAt" = $2
       WHERE id = $3`,
      [JSON.stringify(updatedFormStructure), now, tableData.value.id]
    )

    // Update local state
    tableData.value.formStructure = updatedFormStructure
    cardConfig.value = config

    ElMessage.success('Card view configuration saved successfully')
  } catch (error) {
    console.error('Error saving card config:', error)
    ElMessage.error('Failed to save card view configuration')
  }
}

// Handle cancel
function handleCancel() {
  // Reset to saved config
  if (tableData.value?.formStructure?.card) {
    localConfig.value = JSON.parse(JSON.stringify(tableData.value.formStructure.card))
    localAdvanced.value = tableData.value.formStructure.card.advanced ? { ...tableData.value.formStructure.card.advanced } : {}
  } else {
    resetToDefault()
  }
}

// Local editor state
const showAdvanced = ref(false)
const fieldToAdd = ref<string>('')

// Local config for editing
const localConfig = ref<CardViewConfig>({
  fields: [],
  titleField: undefined,
  subtitleField: undefined,
  coverField: undefined
})

const localAdvanced = ref<AdvancedConfig>({})

// Initialize local config from loaded data
watch(cardConfig, (newValue) => {
  if (newValue) {
    localConfig.value = JSON.parse(JSON.stringify(newValue))
    localAdvanced.value = newValue.advanced ? { ...newValue.advanced } : {}
  }
}, { immediate: true })

// Filter text fields for title/subtitle
const textFields = computed(() => {
  return fieldInfoList.value.filter(f => 
    f.type === 19 || f.type === 1 || f.type === 9 || f.type === 8 || f.type === 10
  )
})

// Filter attachment fields for cover
const attachmentFields = computed(() => {
  return fieldInfoList.value.filter(f => f.type === 6)
})

// Available fields (not already selected)
const availableFields = computed(() => {
  const selectedNames = new Set(localConfig.value.fields.map(f => f.fieldName))
  return fieldInfoList.value.filter(f => !selectedNames.has(f.fieldName) && !f.isSystem)
})

// Visible fields for preview (exclude special fields)
const visiblePreviewFields = computed(() => {
  const specialFields = new Set([
    localConfig.value.titleField,
    localConfig.value.subtitleField,
    localConfig.value.coverField
  ].filter(Boolean))

  return localConfig.value.fields.filter(f => 
    !f.hidden && !specialFields.has(f.fieldName)
  )
})

// Get field label
function getFieldLabel(fieldName: string): string {
  const field = fieldInfoList.value.find(f => f.fieldName === fieldName)
  return field?.fieldNameAlias || fieldName
}

// Add a field
function addField(fieldName: string) {
  if (!fieldName) return
  localConfig.value.fields.push({ fieldName, colSpan: 6 })
  fieldToAdd.value = ''
}

// Remove a field
function removeField(fieldName: string) {
  localConfig.value.fields = localConfig.value.fields.filter(f => f.fieldName !== fieldName)
}

// Reset to default
function resetToDefault() {
  const displayableFields = fieldInfoList.value.filter(f => 
    !f.isSystem && f.type !== 6 && f.type !== 14
  )

  const titleField = displayableFields.find(f => f.type === 19 || f.type === 1)?.fieldName

  localConfig.value = {
    fields: displayableFields.slice(0, 5).map(f => ({
      fieldName: f.fieldName,
      colSpan: 6
    })),
    titleField
  }
  localAdvanced.value = {}
}

// Handle save
function handleSave() {
  const hasAdvanced = localAdvanced.value.customCSS || localAdvanced.value.customJS
  const config: CardViewConfig = {
    ...localConfig.value,
    advanced: hasAdvanced ? { ...localAdvanced.value } : undefined
  }
  handleSaveCardConfig(config)
}

onMounted(() => {
  loadTableData()
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    loadTableData()
  }
)
</script>

<template>
  <div class="card-settings">
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="!tableData" class="empty-state">
      <Icon name="lucide:table" size="48" />
      <p>No table selected</p>
    </div>

    <div v-else class="card-editor">
      <!-- Header -->
      <div class="editor-header">
        <div class="header-info">
          <h3>Card View Configuration</h3>
          <p class="description">
            Configure how records appear in card previews, hover popups, and kanban view.
          </p>
        </div>
        <div class="header-actions">
          <el-button size="small" @click="resetToDefault">
            <Icon name="lucide:rotate-ccw" size="14" />
            Reset to Default
          </el-button>
          <el-button
            size="small"
            :type="showAdvanced ? 'primary' : 'default'"
            @click="showAdvanced = !showAdvanced"
          >
            <Icon name="lucide:code" size="14" />
            Advanced
          </el-button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="editor-content">
        <!-- Left: Configuration -->
        <div class="config-panel">
          <!-- Special Fields -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <Icon name="lucide:star" size="16" />
                <span>Special Fields</span>
              </div>
            </template>

            <el-form label-position="top" size="small">
              <el-form-item label="Title Field">
                <el-select
                  v-model="localConfig.titleField"
                  placeholder="Select title field"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="field in textFields"
                    :key="field.fieldName"
                    :label="field.fieldNameAlias"
                    :value="field.fieldName"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Subtitle Field">
                <el-select
                  v-model="localConfig.subtitleField"
                  placeholder="Select subtitle field"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="field in textFields"
                    :key="field.fieldName"
                    :label="field.fieldNameAlias"
                    :value="field.fieldName"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="Cover Image Field">
                <el-select
                  v-model="localConfig.coverField"
                  placeholder="Select attachment field for cover"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="field in attachmentFields"
                    :key="field.fieldName"
                    :label="field.fieldNameAlias"
                    :value="field.fieldName"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- Fields Configuration -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <Icon name="lucide:list" size="16" />
                <span>Display Fields</span>
                <span class="field-count">{{ localConfig.fields.length }} fields</span>
              </div>
            </template>

            <!-- Selected Fields -->
            <div class="selected-fields">
              <div v-if="localConfig.fields.length === 0" class="empty-fields">
                <Icon name="lucide:layers" size="24" />
                <span>No fields selected</span>
              </div>

              <draggable
                v-else
                v-model="localConfig.fields"
                item-key="fieldName"
                handle=".drag-handle"
                ghost-class="ghost"
              >
                <template #item="{ element }">
                  <div class="field-item">
                    <div class="drag-handle">
                      <Icon name="lucide:grip-vertical" size="14" />
                    </div>
                    
                    <div class="field-info">
                      <span class="field-label">{{ getFieldLabel(element.fieldName) }}</span>
                    </div>

                    <div class="field-controls">
                      <el-select
                        v-model="element.colSpan"
                        size="small"
                        style="width: 80px"
                      >
                        <el-option :value="3" label="1/4" />
                        <el-option :value="4" label="1/3" />
                        <el-option :value="6" label="1/2" />
                        <el-option :value="8" label="2/3" />
                        <el-option :value="12" label="Full" />
                      </el-select>

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

            <!-- Add Field -->
            <div class="add-field-section">
              <el-select
                v-model="fieldToAdd"
                placeholder="Add a field..."
                style="width: 100%"
                filterable
                @change="addField"
              >
                <el-option
                  v-for="field in availableFields"
                  :key="field.fieldName"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </div>
          </el-card>

          <!-- Advanced Settings -->
          <el-card v-if="showAdvanced" class="config-section" shadow="never">
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
                  :rows="5"
                  placeholder=".card-preview { /* your styles */ }"
                />
              </el-form-item>

              <el-form-item label="Custom JavaScript">
                <el-input
                  v-model="localAdvanced.customJS"
                  type="textarea"
                  :rows="5"
                  placeholder="// Custom logic for card rendering"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </div>

        <!-- Right: Live Preview -->
        <div class="preview-panel">
          <el-card class="preview-card" shadow="never">
            <template #header>
              <div class="section-header">
                <Icon name="lucide:eye" size="16" />
                <span>Live Preview</span>
              </div>
            </template>

            <div class="preview-container">
              <div class="card-preview">
                <!-- Title -->
                <div v-if="localConfig.titleField" class="preview-title">
                  {{ getFieldLabel(localConfig.titleField) }}
                </div>

                <!-- Subtitle -->
                <div v-if="localConfig.subtitleField" class="preview-subtitle">
                  {{ getFieldLabel(localConfig.subtitleField) }}
                </div>

                <!-- Fields Grid -->
                <div class="preview-fields">
                  <template v-for="field in visiblePreviewFields" :key="field.fieldName">
                    <div 
                      class="preview-field"
                      :style="{ gridColumn: `span ${field.colSpan || 6}` }"
                    >
                      <div class="field-label">{{ getFieldLabel(field.fieldName) }}</div>
                      <div class="field-value">[Sample Value]</div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <div class="preview-note">
              <Icon name="lucide:info" size="14" />
              <span>Preview uses field names. Actual cards will display real record values.</span>
            </div>
          </el-card>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="editor-footer">
        <el-button @click="handleCancel">Cancel</el-button>
        <el-button type="primary" @click="handleSave">
          Save Configuration
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-state {
  padding: var(--app-space-l);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--el-text-color-placeholder);

  p {
    margin: 0;
    font-size: var(--app-font-size-m);
  }
}

.card-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);

  h3 {
    margin: 0 0 var(--app-space-xs) 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .description {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.editor-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  overflow: auto;
}

.config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.config-section {
  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: var(--app-space-m);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);

  .field-count {
    margin-left: auto;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
}

.selected-fields {
  min-height: 100px;
  margin-bottom: var(--app-space-s);
}

.empty-fields {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-l);
  gap: var(--app-space-xs);
  color: var(--el-text-color-placeholder);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-border-radius-base);
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

  &:hover {
    border-color: var(--el-border-color);
    background: var(--el-fill-color);
  }

  &:last-child {
    margin-bottom: 0;
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
}

.field-label {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.add-field-section {
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--el-border-color-lighter);
}

.preview-panel {
  position: sticky;
  top: 0;
  height: fit-content;
}

.preview-card {
  :deep(.el-card__header) {
    padding: var(--app-space-s) var(--app-space-m);
    background: var(--el-fill-color-light);
  }

  :deep(.el-card__body) {
    padding: var(--app-space-m);
  }
}

.preview-container {
  padding: var(--app-space-m);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
  display: flex;
  justify-content: center;
}

.card-preview {
  width: 100%;
  max-width: 300px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-m);
  box-shadow: var(--el-box-shadow-light);
}

.preview-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: var(--app-space-xs);
}

.preview-subtitle {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-secondary);
  margin-bottom: var(--app-space-m);
}

.preview-fields {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--app-space-s);
}

.preview-field {
  min-width: 0;

  .field-label {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
    font-weight: 500;
    margin-bottom: 2px;
  }

  .field-value {
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-placeholder);
    font-style: italic;
  }
}

.preview-note {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  margin-top: var(--app-space-s);
  padding: var(--app-space-s);
  background: var(--el-color-info-light-9);
  border-radius: var(--el-border-radius-small);
  font-size: var(--app-font-size-xs);
  color: var(--el-color-info);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
}
</style>
