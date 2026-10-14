<script lang="ts" setup>
import {
  formatInventoryStatQty,
  useInventoryStat,
  type InventoryStatLevel,
  type InventoryStatRow,
  type InventoryWarehouse
} from '../../../../composables/useInventoryStat'

const { t } = useI18n()
const { filterForm, summary, loading, fetchRoot, fetchChildren, resetFilter } =
  useInventoryStat()

const levelOptions: { label: string; value: InventoryStatLevel }[] = [
  { label: t('inventoryStat.levelBrand'), value: 'brand' },
  { label: t('inventoryStat.levelItem'), value: 'item' },
  { label: t('inventoryStat.levelWarehouse'), value: 'warehouse' },
  { label: t('inventoryStat.levelSubInventory'), value: 'sub_inventory' },
  { label: t('inventoryStat.levelDateCode'), value: 'date_code' }
]

const warehouseOptions: { label: string; value: InventoryWarehouse }[] = [
  { label: 'HK1', value: 'HK1' },
  { label: 'GZ', value: 'GZ' },
  { label: 'SH', value: 'SH' },
  { label: 'SZ', value: 'SZ' }
]

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'wclInventoryStatTable',
  height: '100%',
  pageSize: 100,
  columns: [
    {
      field: 'label',
      title: t('inventoryStat.label'),
      minWidth: 240,
      treeNode: true
    },
    {
      field: 'currentQty',
      title: t('inventoryStat.currentQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatInventoryStatQty(cellValue)
    },
    {
      field: 'allocatedQty',
      title: t('inventoryStat.allocatedQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatInventoryStatQty(cellValue)
    },
    {
      field: 'availableQty',
      title: t('inventoryStat.availableQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatInventoryStatQty(cellValue)
    }
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
      loadMethod: async ({ row }: { row: InventoryStatRow }) => fetchChildren(row)
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
  <DashboardCard :title="t('inventoryStat.title')">
    <div class="inventory-stat">
      <div class="inventory-stat-summary" aria-label="summary">
        <span>
          {{ t('inventoryStat.currentQty') }}:
          {{ formatInventoryStatQty(summary.currentQty) }}
        </span>
        <span>
          {{ t('inventoryStat.allocatedQty') }}:
          {{ formatInventoryStatQty(summary.allocatedQty) }}
        </span>
        <span>
          {{ t('inventoryStat.availableQty') }}:
          {{ formatInventoryStatQty(summary.availableQty) }}
        </span>
      </div>
      <div class="inventory-stat-table">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <ResponsiveCollapseFilter class="toolbar-filters">
              <ElSelect
                v-model="filterForm.level"
                :placeholder="t('inventoryStat.level')"
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
                :placeholder="t('inventoryStat.brand')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.itemNo"
                :placeholder="t('inventoryStat.itemNo')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElSelect
                v-model="filterForm.warehouse"
                :placeholder="t('inventoryStat.warehouse')"
                clearable
                class="filter-item filter-select"
                @change="handleFilter"
              >
                <ElOption
                  v-for="item in warehouseOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
              <ElButton type="primary" :loading="loading" @click="handleFilter">
                {{ t('inventoryStat.search') }}
              </ElButton>
              <ElButton @click="handleResetFilter">{{ t('inventoryStat.reset') }}</ElButton>
            </ResponsiveCollapseFilter>
          </template>
        </VxeGrid>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.inventory-stat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.inventory-stat-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.inventory-stat-table {
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
