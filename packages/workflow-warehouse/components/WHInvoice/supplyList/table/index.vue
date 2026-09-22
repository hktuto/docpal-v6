<template>
  <div ref="tableContainerRef" class="verification-table" v-loading="loading || matchingLoading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <WHVerifyTableToolbar
          v-model="statusFilter"
          v-model:search="searchQuery"
          :counts="statusCounts"
          :tabs="statusTabs"
          :creating-row="creatingRow"
          :disabled="disabled || !selectedInvoice || matchingLoading"
          @add-row="addRow"
        />
      </template>
    </VxeGrid>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { useInvoiceVerifyTableInject } from '../../../../composables/useInvoiceVerifyTable'
import { useInvoiceVerifyInject } from '../../../../composables/useInvoiceVerify'
import type { VerificationStatusFilter } from '../../../../utils/tableHelper'

const { t } = useI18n()
const {
  loading,
  matchingLoading,
  creatingRow,
  tableConfig,
  tableEvent,
  tableRef,
  statusFilter,
  statusCounts,
  searchQuery,
  addRow
} = useInvoiceVerifyTableInject()

const { disabled, selectedInvoice } = useInvoiceVerifyInject()
const tableContainerRef = ref<HTMLElement | null>(null)

const statusTabs = computed(() => [
  { label: t('All'), value: 'all' as VerificationStatusFilter },
  { label: t('workflowWarehouse.unmatched'), value: 'unVerified' as VerificationStatusFilter },
  { label: t('workflowWarehouse.matched'), value: 'ok' as VerificationStatusFilter }
])

function handleRecalculateTable() {
  const grid = tableRef.value as any
  if (!grid) return
  grid.recalculate?.(true)
}

/** 首屏 splitter/drawer 布局未稳定时，需要多帧 + 延迟再算一次 */
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

watch(
  [loading, matchingLoading, () => selectedInvoice.value?.id],
  () => {
    handleScheduleRecalculate()
  }
)

onMounted(() => {
  handleScheduleRecalculate()
  if (!tableContainerRef.value || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    handleDebouncedRecalculate()
  })
  resizeObserver.observe(tableContainerRef.value)
  const panel = tableContainerRef.value.parentElement
  if (panel) resizeObserver.observe(panel)
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

  :deep(.vxe-toolbar) {
    gap: unset;
  }

  :deep(.vxe-body--row.wha-invoice-row-matched),
  :deep(.vxe-body--row.wha-invoice-row-matched .vxe-body--column) {
    background-color: var(--el-color-success-light-9) !important;
  }

  :deep(.vxe-body--row.wha-verify-row-highlight),
  :deep(.vxe-body--row.wha-verify-row-highlight .vxe-body--column) {
    background-color: var(--el-color-danger-light-7) !important;
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
