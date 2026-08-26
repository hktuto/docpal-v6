<template>
  <div class="verification-table" v-loading="loading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <WHVerifyTableToolbar
          v-model="statusFilter"
          v-model:search="searchQuery"
          :counts="statusCounts"
          :tabs="statusTabs"
          :creating-row="creatingRow"
          :disabled="disabled || !selectedInvoice"
          @add-row="addRow"
        />
      </template>
    </VxeGrid>
  </div>
</template>

<script setup lang="ts">
import { useInvoiceVerifyTableInject } from '../../../../composables/useInvoiceVerifyTable'
import { useInvoiceVerifyInject } from '../../../../composables/useInvoiceVerify'
import type { VerificationStatusFilter } from '../../../../utils/tableHelper'

const { t } = useI18n()
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
} = useInvoiceVerifyTableInject()

const { disabled, selectedInvoice } = useInvoiceVerifyInject()

const statusTabs = computed(() => [
  { label: t('All'), value: 'all' as VerificationStatusFilter },
  { label: t('workflowWarehouse.unmatched'), value: 'unVerified' as VerificationStatusFilter },
  { label: t('workflowWarehouse.matched'), value: 'ok' as VerificationStatusFilter }
])
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
