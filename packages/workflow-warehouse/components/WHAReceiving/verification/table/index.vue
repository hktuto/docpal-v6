<template>
  <div class="verification-table" v-loading="loading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <WHAReceivingVerificationTableToolbar
          v-model="statusFilter"
          v-model:search="searchQuery"
          :counts="statusCounts"
        />
      </template>

      <template #verifyStatus="{ row }">
        <div class="status-actions">
          <el-checkbox v-model="row[SGLA_ITEMS.Checked]" />
        </div>
      </template>
    </VxeGrid>
  </div>
</template>

<script setup lang="ts">
import { useWHAReceivingVerificationTableInject } from '../../../../composables/useWHAReceivingVerificationTable'

const {
  loading,
  tableConfig,
  tableEvent,
  tableRef,
  statusFilter,
  statusCounts,
  searchQuery,
  SGLA_ITEMS
} = useWHAReceivingVerificationTableInject()
</script>

<style lang="scss" scoped>
.verification-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  :deep(.vxe-grid) {
    height: 100%;
  }

  :deep(.vxe-toolbar) {
    padding: var(--app-space-xs) 0;
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
}

.status-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
