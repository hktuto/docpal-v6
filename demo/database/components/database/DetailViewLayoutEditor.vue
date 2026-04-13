<script lang="ts" setup>
import type { Table, DetailViewWidget, DetailViewLayout, DetailViewWidgetType, Column } from '../../types/database'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { Plus, Delete, Edit } from '@element-plus/icons-vue'

const props = defineProps<{
  table: Table
  modelValue: DetailViewLayout | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [layout: DetailViewLayout]
  save: []
}>()

// Default layout
const defaultLayout: DetailViewLayout = {
  widgets: [],
  colNum: 12,
  rowHeight: 60
}

// Local layout state
const layout = ref<DetailViewLayout>(props.modelValue || defaultLayout)

// Watch for prop changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    layout.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true })

// Emit changes
watch(layout, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// Add widget dialog
const showAddWidgetDialog = ref(false)
const newWidget = ref<{
  type: DetailViewWidgetType
  fieldId: string
  title: string
  fieldIds: string[]
  relationFieldId: string
}>({
  type: 'field',
  fieldId: '',
  title: '',
  fieldIds: [],
  relationFieldId: ''
})

const widgetTypeOptions: { value: DetailViewWidgetType; label: string; icon: string; description: string }[] = [
  { value: 'field', label: 'Field', icon: '📝', description: 'Display a single field' },
  { value: 'section', label: 'Section', icon: '📋', description: 'Group multiple fields' },
  { value: 'relations', label: 'Related Records', icon: '🔗', description: 'Show related data' }
]

// Available fields based on widget type
const availableFields = computed(() => {
  return props.table.columns.filter(c => c.type !== 'attachment')
})

const availableRelations = computed(() => {
  return props.table.columns.filter(c => c.type === 'relation')
})

function handleOpenAddWidget() {
  newWidget.value = {
    type: 'field',
    fieldId: '',
    title: '',
    fieldIds: [],
    relationFieldId: ''
  }
  showAddWidgetDialog.value = true
}

function handleAddWidget() {
  const widget: DetailViewWidget = {
    id: `widget-${Date.now()}`,
    type: newWidget.value.type,
    x: 0,
    y: layout.value.widgets.length * 2,
    w: newWidget.value.type === 'field' ? 6 : 12,
    h: newWidget.value.type === 'field' ? 1 : newWidget.value.type === 'section' ? 3 : 4,
    config: {}
  }

  switch (newWidget.value.type) {
    case 'field':
      widget.config.fieldId = newWidget.value.fieldId
      break
    case 'section':
      widget.config.title = newWidget.value.title
      widget.config.fieldIds = newWidget.value.fieldIds
      break
    case 'relations':
      widget.config.relationFieldId = newWidget.value.relationFieldId
      break
  }

  layout.value.widgets.push(widget)
  showAddWidgetDialog.value = false
}

function handleDeleteWidget(widgetId: string) {
  const index = layout.value.widgets.findIndex(w => w.id === widgetId)
  if (index !== -1) {
    layout.value.widgets.splice(index, 1)
  }
}

function getFieldLabel(fieldId: string): string {
  const field = props.table.columns.find(c => c.id === fieldId || c.field === fieldId)
  return field?.title || fieldId
}

function getWidgetTitle(widget: DetailViewWidget): string {
  switch (widget.type) {
    case 'field':
      return getFieldLabel(widget.config.fieldId || '')
    case 'section':
      return widget.config.title || 'Section'
    case 'relations':
      return getFieldLabel(widget.config.relationFieldId || '')
    default:
      return widget.type
  }
}

function getWidgetIcon(type: DetailViewWidgetType): string {
  const option = widgetTypeOptions.find(o => o.value === type)
  return option?.icon || '📝'
}

function handleLayoutUpdated(newLayout: any[]) {
  layout.value.widgets = layout.value.widgets.map((widget, index) => ({
    ...widget,
    x: newLayout[index].x,
    y: newLayout[index].y,
    w: newLayout[index].w,
    h: newLayout[index].h
  }))
}

function handleSave() {
  emit('save')
}

function handleResetToDefault() {
  if (confirm('Reset to default layout? This will create a simple field-based layout.')) {
    // Create default layout with all fields
    const widgets: DetailViewWidget[] = props.table.columns
      .filter(c => c.type !== 'attachment')
      .map((col, index) => ({
        id: `widget-${col.id}`,
        type: 'field' as DetailViewWidgetType,
        x: (index % 2) * 6,
        y: Math.floor(index / 2) * 1,
        w: 6,
        h: 1,
        config: {
          fieldId: col.id
        }
      }))

    layout.value = {
      widgets,
      colNum: 12,
      rowHeight: 60
    }
  }
}
</script>

<template>
  <div class="detail-view-layout-editor">
    <div class="editor-header">
      <h3>Detail View Layout</h3>
      <div class="header-actions">
        <el-button size="small" @click="handleResetToDefault">
          Reset to Default
        </el-button>
        <el-button type="primary" size="small" :icon="Plus" @click="handleOpenAddWidget">
          Add Widget
        </el-button>
        <el-button type="success" size="small" @click="handleSave">
          Save Layout
        </el-button>
      </div>
    </div>

    <div class="editor-content">
      <div v-if="layout.widgets.length === 0" class="empty-state">
        <p>No widgets configured</p>
        <el-button type="primary" @click="handleOpenAddWidget">
          Add Your First Widget
        </el-button>
      </div>

      <GridLayout
        v-else
        v-model:layout="layout.widgets"
        :col-num="layout.colNum || 12"
        :row-height="layout.rowHeight || 60"
        :is-draggable="true"
        :is-resizable="true"
        :vertical-compact="true"
        :use-css-transforms="true"
        :margin="[12, 12]"
        @layout-updated="handleLayoutUpdated"
      >
        <GridItem
          v-for="widget in layout.widgets"
          :key="widget.id"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="widget.id"
        >
          <div class="widget-preview">
            <div class="widget-header">
              <span class="widget-icon">{{ getWidgetIcon(widget.type) }}</span>
              <span class="widget-title">{{ getWidgetTitle(widget) }}</span>
              <el-button
                type="danger"
                text
                :icon="Delete"
                size="small"
                @click="handleDeleteWidget(widget.id)"
              />
            </div>
            <div class="widget-body">
              <div v-if="widget.type === 'field'" class="field-widget">
                <span class="field-label">{{ getFieldLabel(widget.config.fieldId || '') }}</span>
                <span class="field-value">[Field Value]</span>
              </div>
              <div v-else-if="widget.type === 'section'" class="section-widget">
                <div class="section-title">{{ widget.config.title }}</div>
                <div class="section-fields">
                  <div v-for="fieldId in widget.config.fieldIds" :key="fieldId" class="section-field">
                    {{ getFieldLabel(fieldId) }}
                  </div>
                </div>
              </div>
              <div v-else-if="widget.type === 'relations'" class="relations-widget">
                <span>Related: {{ getFieldLabel(widget.config.relationFieldId || '') }}</span>
              </div>
            </div>
          </div>
        </GridItem>
      </GridLayout>
    </div>

    <!-- Add Widget Dialog -->
    <el-dialog
      v-model="showAddWidgetDialog"
      title="Add Widget"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Widget Type" required>
          <el-radio-group v-model="newWidget.type" class="widget-type-group">
            <el-radio-button
              v-for="option in widgetTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              <div class="widget-type-option">
                <span class="widget-type-icon">{{ option.icon }}</span>
                <div class="widget-type-info">
                  <div class="widget-type-label">{{ option.label }}</div>
                  <div class="widget-type-desc">{{ option.description }}</div>
                </div>
              </div>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- Field Widget Config -->
        <template v-if="newWidget.type === 'field'">
          <el-form-item label="Select Field" required>
            <el-select
              v-model="newWidget.fieldId"
              placeholder="Choose a field"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="field in availableFields"
                :key="field.id"
                :label="field.title"
                :value="field.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- Section Widget Config -->
        <template v-if="newWidget.type === 'section'">
          <el-form-item label="Section Title" required>
            <el-input
              v-model="newWidget.title"
              placeholder="Enter section title"
            />
          </el-form-item>
          <el-form-item label="Select Fields" required>
            <el-select
              v-model="newWidget.fieldIds"
              multiple
              placeholder="Choose fields"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="field in availableFields"
                :key="field.id"
                :label="field.title"
                :value="field.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- Relations Widget Config -->
        <template v-if="newWidget.type === 'relations'">
          <el-form-item label="Select Relation Field" required>
            <el-select
              v-model="newWidget.relationFieldId"
              placeholder="Choose a relation field"
              style="width: 100%"
              filterable
            >
              <el-option
                v-for="field in availableRelations"
                :key="field.id"
                :label="field.title"
                :value="field.id"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="showAddWidgetDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="handleAddWidget"
        >
          Add Widget
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.detail-view-layout-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-m);
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-fill-color);

  h3 {
    margin: 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
  }
}

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-m);
  background: var(--app-bg-color-page);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);
}

.widget-preview {
  height: 100%;
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background: var(--app-fill-color);
  border-bottom: 1px solid var(--app-border-color);
  font-weight: 500;
  font-size: var(--app-font-size-s);
}

.widget-icon {
  font-size: var(--app-font-size-m);
}

.widget-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-body {
  flex: 1;
  padding: var(--app-space-s);
  overflow: auto;
}

.field-widget {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
  font-weight: 500;
}

.field-value {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
  font-style: italic;
}

.section-widget {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.section-title {
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin-bottom: var(--app-space-xs);
}

.section-fields {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.section-field {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  padding: 4px 8px;
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-xs);
}

.relations-widget {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.widget-type-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  width: 100%;

  :deep(.el-radio-button) {
    width: 100%;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    border-radius: var(--app-border-radius-s) !important;
    border-left-width: 1px !important;
    padding: var(--app-space-s);
    text-align: left;
  }
}

.widget-type-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.widget-type-icon {
  font-size: 24px;
}

.widget-type-info {
  flex: 1;
  text-align: left;
}

.widget-type-label {
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.widget-type-desc {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
  margin-top: 2px;
}

// Grid layout styles
:deep(.vue-grid-layout) {
  background: transparent;
}

:deep(.vue-grid-item) {
  transition: all 0.2s ease;

  &.vue-grid-item-resizing,
  &.vue-grid-item-moving {
    opacity: 0.8;
    z-index: 100;
  }
}

:deep(.vue-resizable-handle) {
  background: var(--app-primary-color);
  opacity: 0.3;

  &:hover {
    opacity: 0.6;
  }
}
</style>

