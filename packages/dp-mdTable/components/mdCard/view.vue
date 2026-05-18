<script setup lang="ts">
import MdCardViewGroup from './viewGroup.vue'
import MdCardViewList from './viewList.vue'

const props = withDefaults(
  defineProps<{
    isGroupingEnabled: boolean
    draggable?: boolean
  }>(),
  {
    isGroupingEnabled: false,
    draggable: false
  }
)

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

const emit = defineEmits<{
  'open-record': [row: any]
  'row-context-menu': [row: any, event: MouseEvent]
  'load-more': []
  reload: []
}>()

const { columns, systemFieldsTypes, updateRow, viewStyleConfig } = useMDCardInject()
const recordCardDialogRef = ref()
const activeViewRef = ref()

const cardWidgetStyle = computed(() => mapViewStyleToWidget(viewStyleConfig.value))
const columnCount = computed(() => {
  return Math.max(1, Math.min(8, viewStyleConfig.value?.cardCount || 1))
})
const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`
  }
})

function mapViewStyleToWidget(config: Record<string, any> | undefined): CardWidgetStyle {
  const c = config || {}
  return {
    showCover: c.showCover ?? !!c.coverFieldId,
    coverField: c.coverFieldId || '',
    stretchCover: c.isCoverFit !== false,
    showFieldName: c.isColNameVisible !== false,
    bordered: c.isBordered !== false,
    compact: !!c.isCompact,
    shadow: c.cardShadow ?? 'small',
    cardCount: c.cardCount || 5
  }
}

function handleOpenRecord(row: any) {
  console.log('handleOpenRecord', row)
  recordCardDialogRef.value.open(row)
  // emit('open-record', row)
}

function handleLoadMore() {
  emit('load-more')
}

function handleRowContextMenu(row: any, event: MouseEvent) {
  emit('row-context-menu', row, event)
}

async function handleEditRecord(data: any, id: string) {
  const updated = await updateRow(id, data)
  if (updated === false) {
    return
  }
  if (props.isGroupingEnabled) {
    await activeViewRef.value?.syncAfterEdit?.(id)
    return
  }
  activeViewRef.value?.updateRow?.(id, data)
}

function commitProxy(type: string = 'reload') {
  if (type === 'reload') {
    emit('reload')
    return
  }
  console.log('commitProxy', type)
}

defineExpose({
  commitProxy
})
</script>

<template>
  <div class="md-card-list">
    <MdCardViewGroup
      v-if="props.isGroupingEnabled"
      ref="activeViewRef"
      :style-config="cardWidgetStyle"
      :grid-style="gridStyle"
      @open-record="handleOpenRecord"
      @row-context-menu="handleRowContextMenu"
    />
    <MdCardViewList
      v-else
      ref="activeViewRef"
      :draggable="props.draggable"
      :style-config="cardWidgetStyle"
      :grid-style="gridStyle"
      @open-record="handleOpenRecord"
      @row-context-menu="handleRowContextMenu"
      @load-more="handleLoadMore"
    />
    <MdFormPopover ref="recordCardDialogRef" :columns="columns" :systemFieldsTypes="systemFieldsTypes" showMoveButtons @submit="handleEditRecord" />
  </div>
</template>

<style scoped lang="scss">
.md-card-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
