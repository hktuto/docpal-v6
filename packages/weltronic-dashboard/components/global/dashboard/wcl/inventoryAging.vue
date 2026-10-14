<script lang="ts" setup>
import {
  formatInventoryAgingQty,
  useInventoryAging,
  type InventoryAgingLevel,
  type InventoryAgingRow
} from '../../../../composables/useInventoryAging'

const { t } = useI18n()
const { filterForm, summary, loading, fetchRoot, fetchChildren, resetFilter } =
  useInventoryAging()

const levelOptions: { label: string; value: InventoryAgingLevel }[] = [
  { label: t('inventoryAging.levelBrand'), value: 'brand' },
  { label: t('inventoryAging.levelItem'), value: 'item' }
]

const qtyColumns = [
  { field: 'qtyLe3Months', titleKey: 'inventoryAging.qtyLe3Months' },
  { field: 'qty3To6Months', titleKey: 'inventoryAging.qty3To6Months' },
  { field: 'qty6To9Months', titleKey: 'inventoryAging.qty6To9Months' },
  { field: 'qty9To12Months', titleKey: 'inventoryAging.qty9To12Months' },
  { field: 'qtyOver12Months', titleKey: 'inventoryAging.qtyOver12Months' },
  { field: 'totalQty', titleKey: 'inventoryAging.totalQty' }
] as const

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'wclInventoryAgingTable',
  height: '100%',
  pageSize: 100,
  columns: [
    {
      field: 'label',
      title: t('inventoryAging.label'),
      minWidth: 220,
      treeNode: true
    },
    ...qtyColumns.map((col) => ({
      field: col.field,
      title: t(col.titleKey),
      minWidth: 120,
      align: 'right' as const,
      formatter: ({ cellValue }: any) => formatInventoryAgingQty(cellValue)
    }))
  ],
  optionalConfig: {
    treeConfig: {
      transform: true,
      rowField: '_rowKey',
      parentField: 'parentId',
      lazy: true,
      indent: 20,
      showLine: true,
      hasChildField: 'hasChild',
      loadMethod: async ({ row }: { row: InventoryAgingRow }) => fetchChildren(row)
    },
    rowConfig: {
      keyField: '_rowKey',
      useKey: true,
      height: 42,
      isHover: true
    },
    pagerConfig: {
      enabled: false
    }
  }
})

tableConfig.proxyConfig.enabled = false

async function loadRoot() {
  tableConfig.loading = true
  try {
    const { list } = await fetchRoot()
    tableConfig.data = list
    await nextTick()
    await tableRef.value?.reloadData?.(list)
  } finally {
    tableConfig.loading = false
  }
}

if (tableConfig.toolbarConfig) {
  tableConfig.toolbarConfig.refresh = {
    queryMethod: () => loadRoot()
  }
}

function handleFilter() {
  loadRoot()
}

function handleResetFilter() {
  resetFilter()
  loadRoot()
}

onMounted(() => {
  loadRoot()
})
</script>

<template>
  <DashboardCard :title="t('inventoryAging.title')">
    <div class="inventory-aging">
      <div class="inventory-aging-summary" aria-label="summary">
        <span>
          {{ t('inventoryAging.qtyLe3Months') }}:
          {{ formatInventoryAgingQty(summary.qtyLe3Months) }}
        </span>
        <span>
          {{ t('inventoryAging.qty3To6Months') }}:
          {{ formatInventoryAgingQty(summary.qty3To6Months) }}
        </span>
        <span>
          {{ t('inventoryAging.qty6To9Months') }}:
          {{ formatInventoryAgingQty(summary.qty6To9Months) }}
        </span>
        <span>
          {{ t('inventoryAging.qty9To12Months') }}:
          {{ formatInventoryAgingQty(summary.qty9To12Months) }}
        </span>
        <span>
          {{ t('inventoryAging.qtyOver12Months') }}:
          {{ formatInventoryAgingQty(summary.qtyOver12Months) }}
        </span>
        <span>
          {{ t('inventoryAging.totalQty') }}:
          {{ formatInventoryAgingQty(summary.totalQty) }}
        </span>
      </div>
      <div class="inventory-aging-table">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <ResponsiveCollapseFilter class="toolbar-filters">
              <ElSelect
                v-model="filterForm.level"
                :placeholder="t('inventoryAging.level')"
                clearable
                class="filter-item filter-select"
                @change="handleFilter"
              >
                <ElOption
                  v-for="item in levelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
              <ElInput
                v-model="filterForm.brand"
                :placeholder="t('inventoryAging.brand')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.itemNo"
                :placeholder="t('inventoryAging.itemNo')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElButton type="primary" :loading="loading" @click="handleFilter">
                {{ t('inventoryAging.search') }}
              </ElButton>
              <ElButton @click="handleResetFilter">{{ t('inventoryAging.reset') }}</ElButton>
            </ResponsiveCollapseFilter>
          </template>
        </VxeGrid>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.inventory-aging {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.inventory-aging-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.inventory-aging-table {
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  position: relative;

  :deep(.vxe-grid) {
    height: 100%;
  }
  :deep(.vxe-toolbar),
  :deep(.vxe-grid--toolbar-wrapper),
  :deep(.vxe-buttons--wrapper) {
    overflow: visible;
  }
}
.toolbar-filters {
  width: 100%;
}
.filter-item {
  flex-shrink: 0;
}
.filter-select {
  width: 140px;
}
.filter-input {
  width: 160px;
}
</style>
