<template>
  <div class="verification-table" v-loading="loading">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <WHASupplyListVerifyTableToolbar
          v-model="statusFilter"
          v-model:search="searchQuery"
          :counts="statusCounts"
        />
      </template>
    </VxeGrid>
  </div>
</template>

<script setup lang="ts">
import { useWHASupplyListVerifyTableInject } from '../../../../composables/useWHASupplyListVerifyTable'

const {
  loading,
  tableConfig,
  tableEvent,
  tableRef,
  statusFilter,
  statusCounts,
  searchQuery
} = useWHASupplyListVerifyTableInject()
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
  :deep(.vxe-toolbar) {
    gap: unset;
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

<style lang="scss">
/* teleported to body — cannot use scoped */
.wha-verify-select-panel {
  &.vxe-select--panel > .vxe-select--panel-wrapper::after {
    display: none;
  }

  .vxe-select--panel-wrapper {
    display: flex;
    flex-direction: column;
    background-color: var(--app-paper, #fff) !important;
  }

  .vxe-select--panel-search {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    background-color: var(--app-paper, #fff);
  }

  .vxe-select--panel-body {
    flex: 1;
    min-height: 0;
  }

  .vxe-select-search--input,
  .vxe-select-search--input .vxe-input--inner {
    background-color: var(--app-paper, #fff);
  }
}
</style>
