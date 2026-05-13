<script setup lang="ts">
import draggable from 'vuedraggable'
import MdCardWidget from './widget.vue'

interface CardWidgetStyle {
  showCover: boolean
  coverField?: string
  stretchCover: boolean
  showFieldName: boolean
  bordered: boolean
  compact: boolean
  shadow: 'none' | 'small' | 'hover'
  cardCount: number
}

defineProps<{
  draggable?: boolean
  styleConfig: CardWidgetStyle
  gridStyle: Record<string, string>
}>()

const emit = defineEmits<{
  'open-record': [row: any]
  'row-context-menu': [row: any, event: MouseEvent]
  'load-more': []
}>()

const { columns, tableData, hasMore, loadingMore } = useMDCardInject()

/** 距底部小于该像素时触发加载更多 */
const LOAD_MORE_THRESHOLD_PX = 80
/** 触发加载更多的最小间隔（ms） */
const LOAD_MORE_MIN_INTERVAL_MS = 400

let lastLoadMoreEmitAt = 0

function tryEmitLoadMore() {
  if (!hasMore.value || loadingMore.value) {
    return
  }
  const now = Date.now()
  if (now - lastLoadMoreEmitAt < LOAD_MORE_MIN_INTERVAL_MS) {
    return
  }
  lastLoadMoreEmitAt = now
  emit('load-more')
}

function tryLoadMoreIfDragContentNotScrollable() {
  if (!hasMore.value || loadingMore.value || !tableData?.value?.length) return
  const el = dragContainerRef.value
  if (!el) return

  // 拖拽模式下是普通渲染，没有虚拟滚动容器，直接判断滚动是否足够
  const remaining = el.scrollHeight - el.clientHeight
  if (remaining > LOAD_MORE_THRESHOLD_PX) return
  tryEmitLoadMore()
}

const localRows = ref<any[]>([])
const isDragging = ref(false)
const dragContainerRef = ref<HTMLElement | null>(null)

watch(
  () => tableData.value,
  (newRows) => {
    if (isDragging.value) return
    localRows.value = [...(newRows || [])]
  },
  { immediate: true }
)

watch(
  () => [tableData?.value?.length ?? 0, hasMore.value, loadingMore.value],
  () => {
    nextTick(() => tryLoadMoreIfDragContentNotScrollable())
  }
)

function handleDragStart() {
  isDragging.value = true
}

function handleDragEnd() {
  isDragging.value = false
  if (!tableData) {
    return
  }
  tableData.value = [...localRows.value]
}

function handleDragScroll(e: Event) {
  const el = e.target
  if (!(el instanceof HTMLElement)) {
    return
  }
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
  if (remaining > LOAD_MORE_THRESHOLD_PX) {
    return
  }
  tryEmitLoadMore()
}

function handleOpenRecord(row: any) {
  emit('open-record', row)
}

function handleRowContextMenu(row: any, event: MouseEvent) {
  emit('row-context-menu', row, event)
}

function updateRow() {}

defineExpose({
  updateRow
})
</script>

<template>
  <div v-if="tableData?.length > 0" ref="dragContainerRef" class="md-card-list-scroll" @scroll="handleDragScroll">
    <draggable
      v-model="localRows"
      item-key="id"
      handle=".drag-handle"
      ghost-class="md-card-ghost-item"
      :animation="200"
      tag="div"
      class="card-grid card-grid--draggable"
      :style="gridStyle"
      @start="handleDragStart"
      @end="handleDragEnd"
    >
      <template #item="{ element }">
        <div class="md-card-draggable-item">
          <MdCardWidget
            :row="element"
            :fields="columns"
            :style-config="styleConfig"
            :draggable="true"
            @open-record="handleOpenRecord"
            @row-context-menu="handleRowContextMenu"
          />
        </div>
      </template>
    </draggable>
  </div>
  <el-empty v-else description="暂无记录" />
</template>

<style scoped lang="scss">
.md-card-list-scroll {
  flex: 1;
  min-height: 0;
  padding: var(--app-space-s);
  overflow: auto;
}

.card-grid {
  display: grid;
  gap: 12px;
  align-items: stretch;
}

.card-grid--draggable {
  /* 拖拽模式下禁用换行以减少布局抖动 */
}

.md-card-draggable-item {
  display: flex;
  width: 100%;
  height: 100%;
}

.md-card-draggable-item :deep(.md-card-widget) {
  width: 100%;
  flex: 1;
}

.md-card-draggable-item.md-card-ghost-item {
  opacity: 0.6;
}
</style>
