<template>
  <el-splitter>
    <el-splitter-panel v-if="editMode" collapsible size="20%" :min="200">
      <el-collapse v-model="activeNames">
        <el-collapse-item v-for="(item, key) in dashboardSettingList" :key="key" :title="$t(`dashboardType.${key}`)" :name="key">
          <div
            class="dashboard-item-widget"
            v-for="(c, ckey) in item"
            :key="ckey"
            draggable="true"
            unselectable="on"
            @dragstart="handleDragStart($event, c)"
            @dragend="handleDragEnd"
            @dblclick.stop="handleAddWidget(c)"
          >
            <SvgIcon v-if="c.icon" class="el-icon--left" :src="`/icons/dashboard/${c.icon}.svg`" style="--icon-size: 12px" />
            {{ $t(`dashboard.${c.label}`) }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-splitter-panel>
    <el-splitter-panel @update:size="handleResize">
      <div
        ref="wrapper"
        style="position: relative; height: 100%; overflow: auto"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dblclick.stop="handleCanvasDblclick"
      >
        <div v-if="layout.length === 0 && editMode" class="dashboard-null-placeholder">
          {{ $t('dashboard.dragToHere') }}
        </div>
        <GridLayout
          ref="gridLayout"
          :style="`--grid-row-height: ${rowHeight}px; --grid-row-margin: 20px;`"
          :class="{ 'vue-grid-layout--edit': editMode }"
          v-model:layout="layout"
          :col-num="colNum"
          :margin="[12, 12]"
          :row-height="rowHeight"
          :is-draggable="draggable"
          :is-resizable="resizable"
          :responsive="true"
          :verticalCompact="true"
          :preventCollision="false"
          :use-css-transforms="true"
        >
          <!-- 拖拽占位符 -->
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
            class="dashboard-placeholder"
          >
            <div class="placeholder-content">
              <el-icon class="placeholder-icon"><Plus /></el-icon>
              <span class="placeholder-text">{{ $t('common_add') }}</span>
            </div>
          </GridItem>

          <GridItem
            v-for="(item, index) in layout"
            :key="item.i"
            class="dashboard-item"
            v-bind="item"
            drag-ignore-from=".no-drag"
            @resize="chartResize(item)"
            @moved="emits('save')"
          >
            <NuxtErrorBoundary>
              <template v-if="!item.component">
                <el-card class="custom-card" shadow="always">
                  <template #header>
                    <b>{{ item.label }} </b>
                  </template>
                  <div class="card-content">
                    <b class="button-container">
                      {{ $t('Dashboard.Home.card.error') }}
                    </b>
                    <div class="button-container">
                      <el-button type="primary" @click="handleDelete(item)">{{ $t('common_confirmDelete') }}</el-button>
                    </div>
                  </div>
                </el-card>
              </template>
              <component
                v-else
                :is="item.component"
                :ref="
                  (el) => {
                    sheetRefs[item.i] = el
                  }
                "
                :id="item.component"
                :key="item.i"
                :setting="item.setting"
                :hideSetting="hideSetting"
                :dates="dates"
                :type="type"
                @delete="handleDelete(item)"
                @refreshSetting="(setting) => handleRefreshSetting(setting, item)"
              >
              </component>
              <template #error="{ error, clearError }">
                <div class="errorBoundaryContainer dashboard">
                  <div class="messageContainer">
                    <h5 class="errorTitle">ERROR : {{ $t(item.label) }}</h5>
                    <pre>
                      {{ error }}
                    </pre>
                    <pre>
                      {{ item }}
                    </pre>
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

<script lang="ts" setup>
import { Refresh, Plus } from '@element-plus/icons-vue'
import { Setting } from '@element-plus/icons-vue'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
// import { GridLayout, GridItem } from "vue3-grid-layout-next";
import { GridItem, GridLayout } from 'grid-layout-plus'
import type { DashboardWidgetSetting } from '~/composables/useDashborad'
import { useDebounceFn } from '@vueuse/core'
import { useDashboardDrag } from '~/utils/dashboardDragHelper'
import { findFirstFitPosition, applyPackedPositions } from '~/utils/dashboardLayoutHelper'

const props = withDefaults(
  defineProps<{
    // layout: DashboardWidgetSetting[],
    resizable?: boolean
    draggable?: boolean
    hideSetting?: boolean
    colNum?: number
    rowHeight?: number
    dates?: any
    editMode?: boolean
    dashboardSettingList?: any
    type?: string
  }>(),
  {
    // layout: [],
    resizable: true,
    draggable: true,
    hideSetting: false,
    colNum: 12,
    rowHeight: 100,
  }
)
const activeNames = ref([])
const leftSize = ref(15)
const rightSize = ref(100)
const layout = defineModel<DashboardWidgetSetting>('layout')

const emits = defineEmits(['refreshSetting', 'delete', 'update:layout', 'save', 'add'])

const sheetRefs = ref<any>({})

function handleAddWidget(widget: DashboardWidgetSetting) {
  const items = (layout.value as DashboardWidgetSetting[] | undefined) || []
  const pos = findFirstFitPosition(items, widget.w, widget.h, props.colNum)
  emits('add', { ...widget, ...pos })
}

function handleCanvasDblclick(event: MouseEvent) {
  if (!props.editMode) return
  const target = event.target as HTMLElement
  if (target.closest('.dashboard-item, .dashboard-placeholder')) return
  const items = (layout.value as DashboardWidgetSetting[] | undefined) || []
  if (!items.length) return
  applyPackedPositions(items, props.colNum)
  emits('save')
}

function handleDelete(row: any) {
  emits('delete', row.i)
}

function handleRefreshSetting(setting: any, row: any) {
  row.setting = setting
  emits('refreshSetting', row)
}
function handleResize() {
  Object.keys(sheetRefs.value).forEach((key) => {
    if (sheetRefs.value[key] && sheetRefs.value[key].resize) {
      setTimeout(() => {
        sheetRefs.value[key].resize()
      }, 100)
    }
  })
}
const chartResize = useDebounceFn(
  (row: any) => {
    if (sheetRefs.value[row.i] && sheetRefs.value[row.i].resize) {
      sheetRefs.value[row.i].resize()
    }
    emits('save')
  },
  1000,
  { maxWait: 5000 }
)
const windowWidth = ref(0)
const calColNum = ref(props.colNum)
const wrapper = ref<HTMLElement>()
const gridLayout = ref()

// 初始化拖拽功能
const { handleDragStart, handleDragOver, handleDrop, handleDragEnd, placeholder } = useDashboardDrag({
  wrapper,
  layout: layout as Ref<DashboardWidgetSetting[]>,
  colNum: calColNum,
  rowHeight: props.rowHeight,
  onAdd: (item) => {
    // 触发保存事件
    emits('save')
  }
})
defineExpose({
  handleResize
})
onMounted(() => {
  if (props.dashboardSettingList) activeNames.value = Object.keys(props.dashboardSettingList)
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
    margin-top: 150px;

    .button-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}

.droppable-element {
  width: 200px;
  height: 100px;
  background-color: red;
}

.dashboard-item {
  :deep(.dashboard-item-main) {
    height: 100%;
  }
}

.dashboard-placeholder {
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

:deep(.setting-man-made) {
  --icon-size: 1.14rem;
  --icon-color: #8796a4;
  position: absolute;
  top: var(--app-space-xs);
  right: var(--app-space-xs);
  cursor: pointer;
}

:deep(.dashboard-auto) {
  overflow: auto;
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
    background-color: var(--app-grey-200);
    /* 背景颜色 */
    background-size: calc((100% - 20px) / 12) calc(var(--grid-row-height) + var(--grid-row-margin));
    /* 网格大小 */
    background-image:
      linear-gradient(to right, var(--app-grey-950) var(--b-gap), transparent var(--b-gap)),
      linear-gradient(to bottom, var(--app-grey-950) var(--b-gap), transparent var(--b-gap));
  }
}

.splitpanes.default-theme .splitpanes__pane {
  background-color: var(--app-grey-950);
}

.dashboard-item-widget {
  border: 1px solid var(--app-grey-800);
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
  background: #fff;
  border: 1px solid #e8e9eb;
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
.dashboard-null-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--app-font-size-xxl);
}
:deep(.el-collapse-item__header),
:deep(.el-collapse-item__wrap) {
  padding-left: var(--app-space-xs);
}
</style>
