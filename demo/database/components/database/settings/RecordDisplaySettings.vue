<script lang="ts" setup>
import type { Database, Table, Column } from '../../../types/database'
import { useDatabase } from '../../../composables/useDatabase'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { updateTable } = useDatabase()

// Active tab
const activeTab = ref<'link-preview' | 'card-view'>('link-preview')

// Link Preview Configuration
interface LinkPreviewConfig {
  fields: string[] // Column IDs in order
  separator: string
  maxFields: number
}

const linkPreviewConfig = ref<LinkPreviewConfig>({
  fields: [],
  separator: ' • ',
  maxFields: 3
})

// Card View Configuration
interface CardFieldConfig {
  columnId: string
  width: 25 | 33 | 50 | 75 | 100
  order: number
}

interface CardViewConfig {
  coverImageField?: string // Column ID for cover image
  titleField?: string // Column ID for title
  fields: CardFieldConfig[]
  showBorder: boolean
  compactMode: boolean
}

const cardViewConfig = ref<CardViewConfig>({
  coverImageField: undefined,
  titleField: undefined,
  fields: [],
  showBorder: true,
  compactMode: false
})

// Initialize from table config
watchEffect(() => {
  // Initialize with first few fields if not configured
  if (linkPreviewConfig.value.fields.length === 0) {
    const defaultFields = props.table.columns
      .filter(c => ['text', 'email', 'single-select', 'number', 'date'].includes(c.type))
      .slice(0, 3)
      .map(c => c.id)
    linkPreviewConfig.value.fields = defaultFields
  }

  // Initialize card view with all fields if not configured
  if (cardViewConfig.value.fields.length === 0) {
    const defaultCardFields = props.table.columns
      .filter(c => c.type !== 'fx' && c.type !== 'rollup')
      .map((c, index) => ({
        columnId: c.id,
        width: 100 as const,
        order: index
      }))
    cardViewConfig.value.fields = defaultCardFields
  }
})

// Available columns for selection
const availableColumns = computed(() => {
  return props.table.columns.filter(c => 
    c.type !== 'fx' && c.type !== 'rollup'
  )
})

// Selected link preview columns
const selectedLinkColumns = computed(() => {
  return linkPreviewConfig.value.fields
    .map(id => props.table.columns.find(c => c.id === id))
    .filter(Boolean) as Column[]
})

// Card view fields with column data
const cardViewFields = computed(() => {
  return cardViewConfig.value.fields
    .map(field => ({
      ...field,
      column: props.table.columns.find(c => c.id === field.columnId)
    }))
    .filter(f => f.column)
    .sort((a, b) => a.order - b.order)
})

// Width options
const widthOptions = [
  { value: 25, label: '25% (1/4)', cols: 4 },
  { value: 33, label: '33% (1/3)', cols: 3 },
  { value: 50, label: '50% (1/2)', cols: 2 },
  { value: 75, label: '75% (3/4)', cols: 1.33 },
  { value: 100, label: '100% (Full)', cols: 1 }
]

// Handle link preview field selection
function handleLinkFieldToggle(columnId: string) {
  const index = linkPreviewConfig.value.fields.indexOf(columnId)
  if (index > -1) {
    linkPreviewConfig.value.fields.splice(index, 1)
  } else {
    if (linkPreviewConfig.value.fields.length < linkPreviewConfig.value.maxFields) {
      linkPreviewConfig.value.fields.push(columnId)
    } else {
      ElMessage.warning(`Maximum ${linkPreviewConfig.value.maxFields} fields allowed`)
    }
  }
}

function isLinkFieldSelected(columnId: string): boolean {
  return linkPreviewConfig.value.fields.includes(columnId)
}

// Handle card field width change
function handleWidthChange(fieldIndex: number, width: number) {
  cardViewConfig.value.fields[fieldIndex].width = width as 25 | 33 | 50 | 75 | 100
}

// Handle card field reorder
function handleCardFieldsReorder() {
  cardViewConfig.value.fields.forEach((field, index) => {
    field.order = index
  })
}

// Save configurations
function saveLinkPreview() {
  // In real implementation, save to table.linkPreviewConfig
  updateTable(props.database.id, props.table.id, {
    // linkPreviewConfig: linkPreviewConfig.value
  })
  ElMessage.success('Link preview settings saved')
  emit('updated')
}

function saveCardView() {
  // In real implementation, save to table.cardViewConfig
  updateTable(props.database.id, props.table.id, {
    // cardViewConfig: cardViewConfig.value
  })
  ElMessage.success('Card view settings saved')
  emit('updated')
}

// Get sample data for preview
function getSampleValue(column: Column): string {
  const samples: Record<string, string> = {
    text: 'Sample Text',
    email: 'user@example.com',
    number: '42',
    date: 'Jan 15, 2024',
    'single-select': 'Option',
    user: 'John Doe',
    url: 'example.com',
    checkbox: '✓',
    rating: '⭐⭐⭐⭐'
  }
  return samples[column.type] || column.title
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">Record Display</h2>
      <p class="section-description">
        Configure how records appear in different contexts
      </p>
    </div>

    <div class="section-content">
      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="display-tabs">
        <!-- Link Preview Tab -->
        <el-tab-pane label="Link Preview" name="link-preview">
          <div class="tab-content">
            <div class="tab-description">
              <el-icon><Link /></el-icon>
              <div>
                <h4>Compact Link Display</h4>
                <p>Choose which fields appear when this table is linked from other tables. Best for inline references.</p>
              </div>
            </div>

            <!-- Field Selection -->
            <div class="field-selection">
              <div class="selection-header">
                <h4>Select Fields (up to {{ linkPreviewConfig.maxFields }})</h4>
                <span class="field-count">
                  {{ linkPreviewConfig.fields.length }} / {{ linkPreviewConfig.maxFields }}
                </span>
              </div>

              <div class="field-checkboxes">
                <draggable
                  v-model="linkPreviewConfig.fields"
                  item-key="id"
                  :animation="200"
                  handle=".drag-handle"
                  class="selected-fields-list"
                >
                  <template #item="{ element: fieldId }">
                    <div class="selected-field-item">
                      <div class="drag-handle">
                        <el-icon><Grid /></el-icon>
                      </div>
                      <span>{{ props.table.columns.find(c => c.id === fieldId)?.title }}</span>
                      <el-button
                        size="small"
                        text
                        @click="handleLinkFieldToggle(fieldId)"
                      >
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                  </template>
                </draggable>

                <div class="available-fields">
                  <el-button
                    v-for="column in availableColumns.filter(c => !isLinkFieldSelected(c.id))"
                    :key="column.id"
                    size="small"
                    :disabled="linkPreviewConfig.fields.length >= linkPreviewConfig.maxFields"
                    @click="handleLinkFieldToggle(column.id)"
                  >
                    <el-icon><Plus /></el-icon>
                    {{ column.title }}
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="preview-section">
              <h4>Preview</h4>
              <div class="link-preview-display">
                <el-icon><Connection /></el-icon>
                <span class="preview-text">
                  {{ selectedLinkColumns.map(c => getSampleValue(c)).join(linkPreviewConfig.separator) || 'Select fields to preview' }}
                </span>
              </div>
            </div>

            <!-- Save Button -->
            <div class="tab-actions">
              <el-button type="primary" @click="saveLinkPreview">
                Save Link Preview Settings
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Card View Tab -->
        <el-tab-pane label="Card View" name="card-view">
          <div class="tab-content">
            <div class="tab-description">
              <el-icon><Postcard /></el-icon>
              <div>
                <h4>Card Layout</h4>
                <p>Design how records appear as cards in Kanban and Gallery views. Drag to reorder fields and set widths.</p>
              </div>
            </div>

            <!-- Cover Image & Title -->
            <div class="card-main-fields">
              <el-form label-position="top">
                <el-form-item label="Cover Image Field (Optional)">
                  <el-select
                    v-model="cardViewConfig.coverImageField"
                    placeholder="Select image/attachment field"
                    clearable
                  >
                    <el-option
                      v-for="col in availableColumns.filter(c => c.type === 'attachment')"
                      :key="col.id"
                      :label="col.title"
                      :value="col.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="Title Field">
                  <el-select
                    v-model="cardViewConfig.titleField"
                    placeholder="Select title field"
                  >
                    <el-option
                      v-for="col in availableColumns"
                      :key="col.id"
                      :label="col.title"
                      :value="col.id"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <!-- Field Configuration -->
            <div class="card-fields-config">
              <h4>Card Fields</h4>
              
              <draggable
                v-model="cardViewConfig.fields"
                :animation="200"
                handle=".drag-handle"
                item-key="columnId"
                class="card-fields-list"
                @end="handleCardFieldsReorder"
              >
                <template #item="{ element: field, index }">
                  <div class="card-field-item">
                    <div class="drag-handle">
                      <el-icon><Grid /></el-icon>
                    </div>
                    
                    <div class="field-info">
                      <span class="field-name">
                        {{ props.table.columns.find(c => c.id === field.columnId)?.title }}
                      </span>
                    </div>

                    <el-select
                      :model-value="field.width"
                      placeholder="Width"
                      class="width-select"
                      @change="(val: number) => handleWidthChange(index, val)"
                    >
                      <el-option
                        v-for="option in widthOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                </template>
              </draggable>
            </div>

            <!-- Card Preview -->
            <div class="preview-section">
              <h4>Card Preview</h4>
              <div class="card-preview">
                <!-- Cover Image -->
                <div v-if="cardViewConfig.coverImageField" class="card-cover">
                  <el-icon><Picture /></el-icon>
                  <span>Cover Image</span>
                </div>

                <!-- Card Content -->
                <div class="card-content">
                  <!-- Title -->
                  <div v-if="cardViewConfig.titleField" class="card-title">
                    {{ props.table.columns.find(c => c.id === cardViewConfig.titleField)?.title || 'Title' }}
                  </div>

                  <!-- Fields in grid -->
                  <div class="card-fields-grid">
                    <div
                      v-for="field in cardViewFields"
                      :key="field.columnId"
                      class="card-field-preview"
                      :style="{ width: `${field.width}%` }"
                    >
                      <div class="field-label">{{ field.column?.title }}</div>
                      <div class="field-value">{{ getSampleValue(field.column!) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Options -->
            <div class="card-options">
              <el-checkbox v-model="cardViewConfig.showBorder">Show Border</el-checkbox>
              <el-checkbox v-model="cardViewConfig.compactMode">Compact Mode</el-checkbox>
            </div>

            <!-- Save Button -->
            <div class="tab-actions">
              <el-button type="primary" @click="saveCardView">
                Save Card View Settings
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
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

.display-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: var(--app-space-l);
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.tab-description {
  display: flex;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--app-fill-color-light);
  border-radius: var(--app-border-radius-s);

  .el-icon {
    font-size: 24px;
    color: var(--app-primary-color);
    flex-shrink: 0;
  }

  h4 {
    margin: 0 0 var(--app-space-xxs) 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.field-selection {
  h4 {
    margin: 0 0 var(--app-space-m) 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-m);
}

.field-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.field-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.selected-fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  min-height: 40px;
}

.selected-field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-primary-color-light-9);
  border: 1px solid var(--app-primary-color-light-7);
  border-radius: var(--app-border-radius-s);

  .drag-handle {
    cursor: grab;
    color: var(--app-text-color-placeholder);

    &:active {
      cursor: grabbing;
    }
  }

  span {
    flex: 1;
    font-weight: 500;
  }
}

.available-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
}

.preview-section {
  h4 {
    margin: 0 0 var(--app-space-m) 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.link-preview-display {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background: var(--app-fill-color);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  font-size: var(--app-font-size-m);

  .preview-text {
    color: var(--app-text-color-primary);
  }
}

.card-main-fields {
  .el-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--app-space-m);
  }
}

.card-fields-config {
  h4 {
    margin: 0 0 var(--app-space-m) 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.card-fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.card-field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color-light);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);

  .drag-handle {
    cursor: grab;
    color: var(--app-text-color-placeholder);

    &:active {
      cursor: grabbing;
    }
  }

  .field-info {
    flex: 1;
  }

  .field-name {
    font-weight: 500;
  }

  .width-select {
    width: 150px;
  }
}

.card-preview {
  max-width: 400px;
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
}

.card-cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-xs);
  height: 150px;
  background: var(--app-fill-color);
  color: var(--app-text-color-placeholder);

  .el-icon {
    font-size: 32px;
  }
}

.card-content {
  padding: var(--app-space-m);
}

.card-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  margin-bottom: var(--app-space-m);
  color: var(--app-text-color-primary);
}

.card-fields-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
}

.card-field-preview {
  padding: var(--app-space-xs);
  box-sizing: border-box;

  .field-label {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-secondary);
    margin-bottom: 2px;
  }

  .field-value {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-primary);
    padding: var(--app-space-xxs) var(--app-space-xs);
    background: var(--app-fill-color);
    border-radius: var(--app-border-radius-xs);
  }
}

.card-options {
  display: flex;
  gap: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--app-fill-color-light);
  border-radius: var(--app-border-radius-s);
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
}
</style>

