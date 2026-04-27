<script lang="ts" setup>
import { useMDGantt, type MDGanttProps } from '../../composables/mdGantt/useMDGantt'
import Toolbar from './toolbar.vue'
import { createGanttViewer, type GanttViewer } from './viewer'
import type { GanttRow, GanttTask } from './viewer/types'

const props = withDefaults(defineProps<MDGanttProps>(), {
  tableId: '',
  editable: false,
  extraColumnConfig: () => ({
    columns: ref([]),
    deleteColumn: () => {},
    updateColumn: () => {},
    addColumn: () => {},
    tableFields: ref([]),
    updatedViewColumnsConfig: () => {},
    saveColumnOrder: () => {},
    columnFilterRules: ref([]),
    columnGroupRules: ref([]),
    columnSortRules: ref([])
  })
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
}>()

const { columns, tableData, getTableData, viewStyleConfig } = useMDGantt(props)

const containerRef = ref<HTMLDivElement>()
const ganttSettingRef = ref()
const viewer = ref<GanttViewer | null>(null)

function initSetting() {
  const style = viewStyleConfig.value
  if (!style || !style.startField || !style.endField) {
    nextTick(() => {
      openSetting()
    })
  }
}

function openSetting() {
  ganttSettingRef.value?.open()
}

function handleFilterChange(rules: any) {
  props.extraColumnConfig?.updateViewFilterSortGroup?.('filterInfo', rules)
  refresh()
}

function handleSortChange(rules: any) {
  props.extraColumnConfig?.updateViewFilterSortGroup?.('sortInfo', rules)
  refresh()
}

async function refresh() {
  tableData.value = []
  nextTick(async () => {
    await getTableData({ pageSize: 1000 })
  })
}

function handleTaskClick(task: GanttTask) {
  console.log('Task clicked', task)
}

function handleRowClick(row: GanttRow) {
  console.log('Row clicked', row)
}

function initViewer() {
  if (!containerRef.value) return

  viewer.value = createGanttViewer({
    container: containerRef,
    rows: tableData,
    columns,
    viewStyleConfig,
    onTaskClick: handleTaskClick,
    onRowClick: handleRowClick
  })

  viewer.value.init()

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      viewer.value?.resize(width, height)
    }
  })

  resizeObserver.observe(containerRef.value)

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
    viewer.value?.destroy()
  })
}

onMounted(() => {
  initSetting()
  refresh().then(() => {
    nextTick(initViewer)
  })
})

watch(tableData, () => {
  if (viewer.value) {
    viewer.value.render()
  }
})
</script>

<template>
  <div class="ganttViewContainer">
    <Toolbar
      :available-columns="columns"
      @refresh="emit('refresh')"
      @search="emit('search', $event)"
      @open-settings="openSetting"
      @filter-change="handleFilterChange"
      @sort-change="handleSortChange"
    />
    <div
      ref="containerRef"
      class="gantt-canvas-container"
      @wheel.passive="viewer?.handleWheel"
    />
    <MdGanttSettingDialog ref="ganttSettingRef" />
  </div>
</template>

<style lang="scss" scoped>
.ganttViewContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}

.gantt-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--app-paper);
  border-radius: var(--app-border-radius-s);
}

.gantt-canvas-container :deep(canvas) {
  display: block;
}
</style>
