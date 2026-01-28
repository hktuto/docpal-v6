<template>
  <el-splitter>
    <el-splitter-panel v-if="editMode" collapsible size="20%" :min="200">
      <el-collapse v-model="activeNames">
        <el-collapse-item 
          v-for="(widgets, key) in widgetSettingList" 
          :key="key" 
          :title="$t(`detailWidgetType.${key}`)" 
          :name="key"
        >
          <div
            v-for="widget in widgets"
            :key="widget.component"
            class="detail-item-widget"
            draggable="true"
            unselectable="on"
            @dragstart="handleDragStart($event, widget)"
            @dragend="handleDragEnd"
            @dblclick="emits('add', widget)"
          >
            <Icon v-if="widget.icon" class="el-icon--left" :name="widget.icon" size="14" />
            {{ $t(`detailWidget.${widget.label}`) }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-splitter-panel>
    <el-splitter-panel @update:size="handleResize">
      <div ref="wrapper" style="position: relative; height: 100%; overflow: auto" @drop="handleDrop" @dragover="handleDragOver">
        <div v-if="layout.length === 0 && editMode" class="detail-null-placeholder">
          {{ $t('detailWidget.dragWidgetsHere') }}
        </div>
        <GridLayout
          ref="gridLayout"
          :style="`--grid-row-height: ${rowHeight}px; --grid-row-margin: 12px;`"
          :class="{ 'vue-grid-layout--edit': editMode }"
          v-model:layout="layout"
          :col-num="colNum"
          :margin="[12, 12]"
          :row-height="rowHeight"
          :is-draggable="draggable"
          :is-resizable="resizable"
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
            class="detail-placeholder"
          >
            <div class="placeholder-content">
              <el-icon class="placeholder-icon"><Plus /></el-icon>
              <span class="placeholder-text">{{ $t('common_add') }}</span>
            </div>
          </GridItem>

          <GridItem
            v-for="item in layout"
            :key="item.i"
            class="detail-item"
            v-bind="item"
            drag-ignore-from=".no-drag"
            @resize="chartResize(item)"
            @moved="emits('save')"
          >
            <NuxtErrorBoundary>
              <template v-if="!componentMap[item.component]">
                <el-card class="custom-card" shadow="always">
                  <template #header>
                    <b>{{ item.label }}</b>
                  </template>
                  <div class="card-content">
                    <b class="button-container">
                      {{ $t('detailWidget.error') }}
                    </b>
                    <div class="button-container">
                      <el-button type="primary" @click="handleDelete(item)">{{ $t('common_confirmDelete') }}</el-button>
                    </div>
                  </div>
                </el-card>
              </template>
              <component
                v-else
                :is="componentMap[item.component]"
                :ref="(el: any) => { widgetRefs[item.i] = el }"
                :key="item.i"
                :setting="item.setting"
                :hide-setting="hideSetting"
                :fields="fields"
                :record="record"
                :table-name="tableName"
                :table-id="tableId"
                :entity-id="entityId"
                :fetch-related-records="fetchRelatedRecords"
                :get-target-fields="getTargetFields"
                :on-open-record="onOpenRecord"
                @delete="handleDelete(item)"
                @refresh-setting="(setting: any) => handleRefreshSetting(setting, item)"
              />
              <template #error="{ error, clearError }">
                <div class="errorBoundaryContainer">
                  <div class="messageContainer">
                    <h5 class="errorTitle">ERROR: {{ $t(`detailWidget.${item.label}`) }}</h5>
                    <pre>{{ error }}</pre>
                    <el-button size="small" :icon="Refresh" circle @click="clearError">
                      {{ $t('common_refresh') }}
                    </el-button>
                  </div>
                </div>
              </template>
            </NuxtErrorBoundary>
          </GridItem>
        </GridLayout>
      </div>
    </el-splitter-panel>
  </el-splitter>
</template>

<script setup lang="ts">
import { Refresh, Plus } from '@element-plus/icons-vue'
import { GridItem, GridLayout } from 'grid-layout-plus'
import type { DetailWidgetSetting } from '../../utils/detailWidgetHelper'
import { useDebounceFn } from '@vueuse/core'
import type { FieldInfo } from '../../types/view-config'

const props = withDefaults(defineProps<{
  /** Allow resizing widgets */
  resizable?: boolean
  /** Allow dragging widgets */
  draggable?: boolean
  /** Hide settings buttons on widgets */
  hideSetting?: boolean
  /** Number of grid columns */
  colNum?: number
  /** Row height in pixels */
  rowHeight?: number
  /** Edit mode - shows widget palette */
  editMode?: boolean
  /** Widget settings grouped by type */
  widgetSettingList?: Record<string, DetailWidgetSetting[]>
  /** Map of component names to component instances */
  componentMap?: Record<string, any>
  /** Available fields from the table */
  fields?: FieldInfo[]
  /** Current record data */
  record?: Record<string, any>
  /** Physical table name (for audit logging) */
  tableName?: string
  /** Table ID (case_tables.id) */
  tableId?: string
  /** Entity/workspace ID */
  entityId?: string
  /** Function to fetch related records */
  fetchRelatedRecords?: (relationFieldName: string, recordIds: string[]) => Promise<any[]>
  /** Function to get fields for target table */
  getTargetFields?: (relationTableId: string) => Promise<FieldInfo[]>
  /** Function to navigate to a record */
  onOpenRecord?: (tableId: string, recordId: string) => void
}>(), {
  resizable: true,
  draggable: true,
  hideSetting: false,
  colNum: 12,
  rowHeight: 80,
  componentMap: () => ({})
})

const activeNames = ref<string[]>([])
const layout = defineModel<DetailWidgetSetting[]>('layout', { default: [] })

const emits = defineEmits(['refreshSetting', 'delete', 'update:layout', 'save', 'add'])

const widgetRefs = ref<Record<string, any>>({})

function handleDelete(row: DetailWidgetSetting) {
  emits('delete', row.i)
}

function handleRefreshSetting(setting: any, row: DetailWidgetSetting) {
  row.setting = setting
  emits('refreshSetting', row)
}

function handleResize() {
  Object.keys(widgetRefs.value).forEach((key) => {
    if (widgetRefs.value[key]?.resize) {
      setTimeout(() => {
        widgetRefs.value[key].resize()
      }, 100)
    }
  })
}

const chartResize = useDebounceFn(
  (row: DetailWidgetSetting) => {
    if (widgetRefs.value[row.i!]?.resize) {
      widgetRefs.value[row.i!].resize()
    }
    emits('save')
  },
  1000,
  { maxWait: 5000 }
)

const calColNum = ref(props.colNum)
const wrapper = ref<HTMLElement>()
const gridLayout = ref()

// Initialize drag functionality
const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, placeholder } = useDetailViewDrag({
  wrapper,
  layout: layout as Ref<DetailWidgetSetting[]>,
  colNum: calColNum,
  rowHeight: props.rowHeight,
  onAdd: () => {
    emits('save')
  }
})

defineExpose({
  handleResize
})

onMounted(() => {
  if (props.widgetSettingList) {
    activeNames.value = Object.keys(props.widgetSettingList)
  }
})
</script>

<style lang="scss" scoped>
.custom-card {
  height: 100%;

  .card-content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--el-card-padding);
    margin-top: 100px;

    .button-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}

.detail-item {
  :deep(.detail-item-main) {
    height: 100%;
  }
}

.detail-placeholder {
  background: transparent !important;
  pointer-events: none;
  z-index: 9999;

  .placeholder-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 2px dashed var(--el-color-primary);
    border-radius: 8px;
    background: rgba(64, 158, 255, 0.05);
    animation: placeholderPulse 1.5s ease-in-out infinite;

    .placeholder-icon {
      font-size: 32px;
      color: var(--el-color-primary);
    }

    .placeholder-text {
      font-size: 14px;
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
}

@keyframes placeholderPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.vue-grid-layout--edit {
  position: relative;

  &::after {
    --b-gap: 24px;
    content: '';
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    position: absolute;
    z-index: -1;
    background-color: var(--el-fill-color-light);
    background-size: calc((100% - 20px) / 12) calc(var(--grid-row-height) + var(--grid-row-margin));
    background-image:
      linear-gradient(to right, var(--el-border-color-lighter) var(--b-gap), transparent var(--b-gap)),
      linear-gradient(to bottom, var(--el-border-color-lighter) var(--b-gap), transparent var(--b-gap));
  }
}

.detail-item-widget {
  border: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  height: 32px;
  line-height: 32px;
  width: fit-content;
  float: left;
  margin: 2px 6px 6px 0;
  cursor: move;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: 4px;
  padding: 0 8px;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    opacity: 0.8;
  }
}

.detail-null-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--app-font-size-xxl);
  color: var(--el-text-color-placeholder);
}

:deep(.el-collapse-item__header),
:deep(.el-collapse-item__wrap) {
  padding-left: var(--app-space-xs);
}

.errorBoundaryContainer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--app-space-m);
  
  .messageContainer {
    text-align: center;
  }
  
  .errorTitle {
    margin: 0 0 var(--app-space-s);
    color: var(--el-color-danger);
  }
  
  pre {
    font-size: var(--app-font-size-xs);
    max-height: 100px;
    overflow: auto;
    margin-bottom: var(--app-space-s);
  }
}
</style>
