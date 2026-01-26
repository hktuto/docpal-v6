<template>
  <div class="detail-view-layout">
    <!-- Header -->
    <div v-if="showHeader" class="layout-header">
      <div class="header-left">
        <el-button 
          v-if="showBackButton" 
          size="small" 
          text 
          @click="emit('back')"
        >
          <Icon name="lucide:arrow-left" size="16" />
          {{ $t('common_back') }}
        </el-button>
        <h2 v-if="title" class="layout-title">{{ title }}</h2>
      </div>
      <div class="header-right">
        <slot name="header-actions">
          <el-button 
            v-if="editable && !editMode" 
            size="small" 
            @click="editMode = true"
          >
            <Icon name="lucide:edit" size="14" />
            {{ $t('common_edit') }}
          </el-button>
          <el-button 
            v-if="editMode" 
            size="small" 
            type="primary" 
            @click="handleFinishEdit"
          >
            {{ $t('dpButtom_finish') }}
          </el-button>
        </slot>
      </div>
    </div>

    <!-- Main Content -->
    <div class="layout-content">
      <el-splitter v-if="editMode">
        <!-- Widget Palette (Edit Mode) -->
        <el-splitter-panel :min="180" size="200px">
          <div class="widget-palette">
            <div class="palette-header">
              {{ $t('detailWidget.availableWidgets') }}
            </div>
            <el-collapse v-model="activePaletteGroups">
              <el-collapse-item 
                v-for="(widgets, groupName) in widgetsByType" 
                :key="groupName" 
                :title="$t(`detailWidgetType.${groupName}`)" 
                :name="groupName"
              >
                <div
                  v-for="widget in widgets"
                  :key="widget.component"
                  class="palette-item"
                  draggable="true"
                  @dragstart="handleDragStart($event, widget)"
                  @dragend="handleDragEnd"
                  @dblclick="handleAddWidget(widget)"
                >
                  <Icon :name="getWidgetIcon(widget.component)" size="14" />
                  {{ $t(`detailWidget.${widget.label}`) }}
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-splitter-panel>

        <!-- Grid Layout -->
        <el-splitter-panel>
          <div 
            ref="gridWrapper" 
            class="grid-wrapper" 
            :class="{ 'edit-mode': editMode }"
            @drop="handleDrop"
            @dragover="handleDragOver"
          >
            <GridLayout
              ref="gridLayoutRef"
              v-model:layout="localLayout"
              :col-num="colNum"
              :row-height="rowHeight"
              :margin="[12, 12]"
              :is-draggable="editMode"
              :is-resizable="editMode"
              :responsive="true"
              :vertical-compact="true"
              :prevent-collision="false"
              :use-css-transforms="true"
            >
              <!-- Drag Placeholder -->
              <GridItem
                v-if="placeholder.show"
                :x="placeholder.x"
                :y="placeholder.y"
                :w="placeholder.w"
                :h="placeholder.h"
                :i="'placeholder'"
                :is-draggable="false"
                :is-resizable="false"
                :static="true"
                class="widget-placeholder"
              >
                <div class="placeholder-content">
                  <Icon name="lucide:plus" size="24" />
                </div>
              </GridItem>

              <!-- Widgets -->
              <GridItem
                v-for="item in localLayout"
                :key="item.i"
                v-bind="item"
                class="widget-item"
                drag-ignore-from=".no-drag"
                @resize="handleWidgetResize(item)"
                @moved="handleWidgetMoved"
              >
                <component
                  :is="getWidgetComponent(item.component)"
                  :ref="(el: any) => { widgetRefs[item.i] = el }"
                  :setting="item.setting"
                  :hide-setting="!editMode"
                  :fields="fields"
                  :record="record"
                  :fetch-related-records="fetchRelatedRecords"
                  :get-target-fields="getTargetFields"
                  :on-open-record="onOpenRecord"
                  @delete="handleDeleteWidget(item)"
                  @refresh-setting="(setting: any) => handleRefreshSetting(item, setting)"
                />
              </GridItem>
            </GridLayout>

            <!-- Empty State -->
            <div v-if="localLayout.length === 0 && editMode" class="empty-state">
              {{ $t('detailWidget.dragWidgetsHere') }}
            </div>
          </div>
        </el-splitter-panel>
      </el-splitter>

      <!-- View Mode (no splitter) -->
      <div v-else class="grid-wrapper view-mode">
        <GridLayout
          ref="gridLayoutRef"
          v-model:layout="localLayout"
          :col-num="colNum"
          :row-height="rowHeight"
          :margin="[12, 12]"
          :is-draggable="false"
          :is-resizable="false"
          :responsive="true"
          :vertical-compact="true"
          :use-css-transforms="true"
        >
          <GridItem
            v-for="item in localLayout"
            :key="item.i"
            v-bind="item"
            class="widget-item"
          >
            <component
              :is="getWidgetComponent(item.component)"
              :ref="(el: any) => { widgetRefs[item.i] = el }"
              :setting="item.setting"
              :hide-setting="true"
              :fields="fields"
              :record="record"
              :fetch-related-records="fetchRelatedRecords"
              :get-target-fields="getTargetFields"
              :on-open-record="onOpenRecord"
            />
          </GridItem>
        </GridLayout>

        <!-- Empty State -->
        <div v-if="localLayout.length === 0" class="empty-state view-mode">
          <Icon name="lucide:layout-dashboard" size="48" />
          <span>{{ $t('detailWidget.noWidgetsConfigured') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus'
import type { DetailWidgetSetting, DetailWidgetType } from '../../utils/detailWidgetHelper'
import { 
  detailWidgetSettings, 
  getDetailWidgetsByType, 
  createWidgetInstance 
} from '../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../types/view-config'
import { TableInfo, RelatedTableList } from './widgets'

const props = withDefaults(defineProps<{
  /** Layout configuration */
  layout?: DetailWidgetSetting[]
  /** Show header with back button and title */
  showHeader?: boolean
  /** Show back button */
  showBackButton?: boolean
  /** Title to display */
  title?: string
  /** Allow editing layout */
  editable?: boolean
  /** Number of grid columns */
  colNum?: number
  /** Row height in pixels */
  rowHeight?: number
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Current record data */
  record: Record<string, any>
  /** Function to fetch related records */
  fetchRelatedRecords?: (relationFieldName: string, recordIds: string[]) => Promise<any[]>
  /** Function to get fields for target table */
  getTargetFields?: (relationTableId: string) => Promise<FieldInfo[]>
  /** Function to navigate to a record */
  onOpenRecord?: (tableId: string, recordId: string) => void
}>(), {
  layout: () => [],
  showHeader: true,
  showBackButton: true,
  editable: false,
  colNum: 12,
  rowHeight: 60
})

const emit = defineEmits<{
  'update:layout': [layout: DetailWidgetSetting[]]
  back: []
  save: []
}>()

// Local state
const editMode = ref(false)
const gridLayoutRef = ref()
const gridWrapper = ref<HTMLElement>()
const widgetRefs = ref<Record<string, any>>({})
const activePaletteGroups = ref<string[]>([])

// Local layout copy
const localLayout = ref<DetailWidgetSetting[]>([])

// Drag state
const draggedWidget = ref<DetailWidgetSetting | null>(null)
const placeholder = ref({
  show: false,
  x: 0,
  y: 0,
  w: 4,
  h: 3
})

// Widget groups
const widgetsByType = computed(() => getDetailWidgetsByType(detailWidgetSettings))

// Initialize palette groups
onMounted(() => {
  activePaletteGroups.value = Object.keys(widgetsByType.value)
})

// Sync layout with props
watch(
  () => props.layout,
  (newLayout) => {
    localLayout.value = newLayout ? [...newLayout] : []
  },
  { immediate: true, deep: true }
)

// Emit layout changes
watch(
  localLayout,
  (newLayout) => {
    emit('update:layout', newLayout)
  },
  { deep: true }
)

// Get widget component
function getWidgetComponent(componentName: string) {
  switch (componentName) {
    case 'TableInfo':
      return TableInfo
    case 'RelatedTableList':
      return RelatedTableList
    default:
      console.warn(`Unknown widget component: ${componentName}`)
      return null
  }
}

// Get widget icon
function getWidgetIcon(componentName: string): string {
  switch (componentName) {
    case 'TableInfo':
      return 'lucide:file-text'
    case 'RelatedTableList':
      return 'lucide:link'
    default:
      return 'lucide:box'
  }
}

// Drag handlers
function handleDragStart(event: DragEvent, widget: DetailWidgetSetting) {
  draggedWidget.value = widget
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function handleDragEnd() {
  draggedWidget.value = null
  placeholder.value.show = false
}

function handleDragOver(event: DragEvent) {
  if (!draggedWidget.value || !gridWrapper.value) return
  
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }

  // Calculate grid position from mouse
  const rect = gridWrapper.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const colWidth = rect.width / props.colNum
  const gridX = Math.floor(x / colWidth)
  const gridY = Math.floor(y / (props.rowHeight + 12))

  placeholder.value = {
    show: true,
    x: Math.max(0, Math.min(gridX, props.colNum - draggedWidget.value.w)),
    y: gridY,
    w: draggedWidget.value.w,
    h: draggedWidget.value.h
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  
  if (!draggedWidget.value) return

  const newWidget = createWidgetInstance(
    draggedWidget.value.component as DetailWidgetType,
    { x: placeholder.value.x, y: placeholder.value.y }
  )
  
  localLayout.value.push(newWidget)
  
  draggedWidget.value = null
  placeholder.value.show = false
}

function handleAddWidget(widget: DetailWidgetSetting) {
  const newWidget = createWidgetInstance(
    widget.component as DetailWidgetType,
    { x: 0, y: localLayout.value.length * 4 }
  )
  localLayout.value.push(newWidget)
}

function handleDeleteWidget(item: DetailWidgetSetting) {
  const index = localLayout.value.findIndex(w => w.i === item.i)
  if (index !== -1) {
    localLayout.value.splice(index, 1)
  }
}

function handleRefreshSetting(item: DetailWidgetSetting, setting: any) {
  const index = localLayout.value.findIndex(w => w.i === item.i)
  if (index !== -1) {
    localLayout.value[index] = {
      ...localLayout.value[index],
      setting
    }
  }
}

function handleWidgetResize(item: DetailWidgetSetting) {
  // Trigger resize on widget if it has a resize method
  const widgetRef = widgetRefs.value[item.i!]
  if (widgetRef?.resize) {
    setTimeout(() => widgetRef.resize(), 100)
  }
}

function handleWidgetMoved() {
  emit('save')
}

function handleFinishEdit() {
  editMode.value = false
  emit('save')
}

// Expose methods
defineExpose({
  setEditMode: (mode: boolean) => { editMode.value = mode }
})
</script>

<style lang="scss" scoped>
.detail-view-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-m);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
}

.layout-title {
  margin: 0;
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  gap: var(--app-space-s);
}

.layout-content {
  flex: 1;
  overflow: hidden;
}

.widget-palette {
  height: 100%;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  overflow-y: auto;
}

.palette-header {
  padding: var(--app-space-m);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  margin: var(--app-space-xs);
  cursor: grab;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  font-size: var(--app-font-size-s);
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }

  &:active {
    cursor: grabbing;
  }
}

.grid-wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
  padding: var(--app-space-m);

  &.edit-mode {
    background-color: var(--el-fill-color-light);
    background-size: calc((100% - 24px) / 12) calc(60px + 12px);
    background-image:
      linear-gradient(to right, var(--el-border-color-lighter) 1px, transparent 1px),
      linear-gradient(to bottom, var(--el-border-color-lighter) 1px, transparent 1px);
  }
}

.widget-item {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.widget-placeholder {
  background: transparent !important;
  pointer-events: none;
  z-index: 9999;

  .placeholder-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--el-color-primary);
    border-radius: var(--el-border-radius-base);
    background: rgba(64, 158, 255, 0.05);
    color: var(--el-color-primary);
  }
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-m);
  color: var(--el-text-color-placeholder);
  font-size: var(--app-font-size-l);
  text-align: center;

  &.view-mode {
    padding: var(--app-space-xxl);
  }
}
</style>
