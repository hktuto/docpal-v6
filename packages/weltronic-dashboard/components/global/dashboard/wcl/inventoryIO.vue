<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  formatInventoryIOQty,
  monthQtyField,
  useInventoryIO,
  type InventoryIOLevel,
  type InventoryIORow
} from '../../../../composables/useInventoryIO'

const { t } = useI18n()
const { filterForm, summary, loading, fetchRoot, fetchChildren, resetFilter } = useInventoryIO()

const levelOptions: { label: string; value: InventoryIOLevel }[] = [
  { label: t('inventoryIO.levelWarehouse'), value: 'warehouse' },
  { label: t('inventoryIO.levelBrand'), value: 'brand' },
  { label: t('inventoryIO.levelItem'), value: 'item' }
]

function buildColumns(monthList: string[]) {
  return [
    {
      field: 'label',
      title: t('inventoryIO.label'),
      minWidth: 220,
      treeNode: true,
      fixed: 'left' as const
    },
    {
      field: 'totalInQty',
      title: t('inventoryIO.totalInQty'),
      minWidth: 120,
      align: 'right' as const,
      fixed: 'left' as const,
      formatter: ({ cellValue }: any) => formatInventoryIOQty(cellValue)
    },
    {
      field: 'totalOutQty',
      title: t('inventoryIO.totalOutQty'),
      minWidth: 120,
      align: 'right' as const,
      fixed: 'left' as const,
      formatter: ({ cellValue }: any) => formatInventoryIOQty(cellValue)
    },
    ...monthList.map((month) => ({
      title: month,
      children: [
        {
          field: monthQtyField(month, 'in'),
          title: t('inventoryIO.inQty'),
          minWidth: 100,
          align: 'right' as const,
          formatter: ({ cellValue }: any) => formatInventoryIOQty(cellValue)
        },
        {
          field: monthQtyField(month, 'out'),
          title: t('inventoryIO.outQty'),
          minWidth: 100,
          align: 'right' as const,
          formatter: ({ cellValue }: any) => formatInventoryIOQty(cellValue)
        }
      ]
    }))
  ]
}

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'wclInventoryIOTable',
  height: '100%',
  pageSize: 100,
  saveColumnOrder: false,
  columns: buildColumns([]),
  optionalConfig: {
    treeConfig: {
      transform: true,
      rowField: '_rowKey',
      parentField: 'parentId',
      lazy: true,
      indent: 20,
      showLine: true,
      hasChildField: 'hasChild',
      loadMethod: async ({ row }: { row: InventoryIORow }) => fetchChildren(row)
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
    const { list, months: nextMonths } = await fetchRoot()
    tableConfig.columns = buildColumns(nextMonths)
    tableConfig.data = list
    await nextTick()
    await tableRef.value?.reloadColumn?.(tableConfig.columns)
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

function disabledMonthStart(date: Date) {
  return filterForm.monthEnd ? dayjs(date).isAfter(filterForm.monthEnd, 'month') : false
}
function disabledMonthEnd(date: Date) {
  return filterForm.monthStart ? dayjs(date).isBefore(filterForm.monthStart, 'month') : false
}

onMounted(() => {
  loadRoot()
})
</script>

<template>
  <DashboardCard :title="t('inventoryIO.title')">
    <div class="inventory-io">
      <div class="inventory-io-summary" aria-label="summary">
        <span>
          {{ t('inventoryIO.totalInQty') }}:
          {{ formatInventoryIOQty(summary.totalInQty) }}
        </span>
        <span>
          {{ t('inventoryIO.totalOutQty') }}:
          {{ formatInventoryIOQty(summary.totalOutQty) }}
        </span>
      </div>
      <div class="inventory-io-table">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <ResponsiveCollapseFilter class="toolbar-filters">
              <ElSelect
                v-model="filterForm.level"
                :placeholder="t('inventoryIO.level')"
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
                v-model="filterForm.warehouse"
                :placeholder="t('inventoryIO.warehouse')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.brand"
                :placeholder="t('inventoryIO.brand')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.itemNo"
                :placeholder="t('inventoryIO.itemNo')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElDatePicker
                v-model="filterForm.monthStart"
                type="month"
                :placeholder="t('inventoryIO.monthStart')"
                value-format="YYYY-MM"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledMonthStart"
              />
              <ElDatePicker
                v-model="filterForm.monthEnd"
                type="month"
                :placeholder="t('inventoryIO.monthEnd')"
                value-format="YYYY-MM"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledMonthEnd"
              />
              <ElButton type="primary" :loading="loading" @click="handleFilter">
                {{ t('inventoryIO.search') }}
              </ElButton>
              <ElButton @click="handleResetFilter">{{ t('inventoryIO.reset') }}</ElButton>
            </ResponsiveCollapseFilter>
          </template>
        </VxeGrid>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.inventory-io {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.inventory-io-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.inventory-io-table {
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
  width: 140px;
}
.filter-date {
  width: 140px;
}
</style>
