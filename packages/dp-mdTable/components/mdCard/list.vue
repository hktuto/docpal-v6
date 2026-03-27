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
}
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

defineProps<{ draggable?: boolean }>()

const emit = defineEmits<{
  'open-record': [row: any]
  'load-more': []
}>()
const { tableId, columns, systemFieldsTypes, updateRow, viewStyleConfig, tableData, hasMore, loadingMore } = useMDCardInject()
const cardWidgetStyle = computed(() => mapViewStyleToWidget(viewStyleConfig.value))
function mapViewStyleToWidget(config: Record<string, any> | undefined): CardWidgetStyle {
  const c = config || {}
  return {
    showCover: c.showCover ?? !!c.coverFieldId,
    coverField: c.coverFieldId || '',
    stretchCover: c.isCoverFit !== false,
    showFieldName: c.isColNameVisible !== false,
    bordered: c.isBordered !== false,
    compact: !!c.isCompact,
    shadow: c.cardShadow ?? 'small'
  }
}
const columnCount = computed(() => {
  return Math.max(1, Math.min(8, viewStyleConfig.value?.cardCount || 1))
})

const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`
  }
})
const recordCardDialogRef = ref()
function handleOpenRecord(row: any) {
  console.log('handleOpenRecord', row)
  recordCardDialogRef.value.open(row)
  // emit('open-record', row)
}
async function handleEditRecord(data: any, id: string) {
  console.log('handleEditRecord', data)
  await updateRow(id, data)
}
const localRows = ref<any[]>([])
const isDragging = ref(false)

watch(
  () => tableData.value,
  (newRows) => {
    if (isDragging.value) return
    localRows.value = [...(newRows || [])]
  },
  { immediate: true }
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

const dragContainerRef = ref<HTMLElement | null>(null)
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
function commitProxy(type: string = 'reload') {
  console.log('commitProxy', type)
}
watch(
  () => [tableData?.value?.length ?? 0, hasMore.value, loadingMore.value],
  () => {
    nextTick(() => tryLoadMoreIfDragContentNotScrollable())
  }
)
defineExpose({
  commitProxy
})
</script>

<template>
  <div class="md-card-list">
    <div v-if="tableData?.length > 0">
      <div
        ref="dragContainerRef"
        class="md-card-list-scroll"
        @scroll="handleDragScroll"
      >
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
                :style-config="cardWidgetStyle"
                :draggable="true"
                @open-record="handleOpenRecord"
              />
            </div>
          </template>
        </draggable>
      </div>
    </div>
    <el-empty v-else description="暂无记录" />
    <MdFormPopover
      ref="recordCardDialogRef"
      :columns="columns"
      :systemFieldsTypes="systemFieldsTypes"
      showMoveButtons
      @submit="handleEditRecord"
    />
  </div>
</template>

<style scoped lang="scss">
.md-card-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.md-card-list-scroll {
  flex: 1;
  min-height: 0;
  padding: var(--app-space-s);
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
