<template>
  <div ref="tableContainerRef" class="verification-table" v-loading="loading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <WHVerifyTableToolbar
          v-model="statusFilter"
          v-model:search="searchQuery"
          :counts="statusCounts"
          :creating-row="creatingRow"
          :disabled="disabled || !selectedPo"
          @add-row="addRow"
        />
      </template>
    </VxeGrid>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useWHPOListTableInject } from '../../../composables/useWHPOListTable'
import { useWHPOListInject } from '../../../composables/useWHPOList'

const {
  loading,
  creatingRow,
  tableConfig,
  tableEvent,
  tableRef,
  statusFilter,
  statusCounts,
  searchQuery,
  addRow
} = useWHPOListTableInject()

const { disabled, selectedPo } = useWHPOListInject()
const tableContainerRef = ref<HTMLElement | null>(null)

function handleRecalculateTable() {
  const grid = tableRef.value as any
  if (!grid) return
  grid.recalculate?.(true)
}

function handleScheduleRecalculate() {
  nextTick(() => {
    handleRecalculateTable()
    requestAnimationFrame(() => {
      handleRecalculateTable()
      requestAnimationFrame(handleRecalculateTable)
    })
    window.setTimeout(handleRecalculateTable, 50)
    window.setTimeout(handleRecalculateTable, 200)
  })
}

const handleDebouncedRecalculate = useDebounceFn(handleRecalculateTable, 50)

let resizeObserver: ResizeObserver | undefined

watch([loading, () => selectedPo.value?.id], () => {
  handleScheduleRecalculate()
})

onMounted(() => {
  handleScheduleRecalculate()
  if (!tableContainerRef.value || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => handleDebouncedRecalculate())
  resizeObserver.observe(tableContainerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.verification-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  --vxe-ui-font-primary-color: var(--app-primary-color);

  :deep(.vxe-grid) {
    height: 100%;
  }

  :deep(.vxe-toolbar) {
    padding: var(--app-space-s) 0;
    background-color: transparent;
    gap: unset;
  }

  :deep(.vxe-buttons--wrapper) {
    width: 100%;
  }

  :deep(.vxe-header--column) {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
  }

  :deep(.vxe-header--column.is-required .vxe-cell--title::before) {
    content: '*';
    color: var(--el-color-danger);
    margin-right: 2px;
  }

  :deep(.vxe-body--row.wha-verify-row-highlight),
  :deep(.vxe-body--row.wha-verify-row-highlight .vxe-body--column) {
    background-color: var(--el-color-danger-light-7) !important;
  }

  :deep(.vxe-body--row.wha-verify-row-located),
  :deep(.vxe-body--row.wha-verify-row-located .vxe-body--column) {
    background-color: var(--el-color-warning-light-7) !important;
  }
}

:deep(.col--edit) {
  position: relative;
  overflow: visible;
  .vxe-textarea {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}
</style>
