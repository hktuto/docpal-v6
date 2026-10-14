<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  formatPoStatAmount,
  formatPoStatQty,
  usePoStat,
  type PoStatLevel,
  type PoStatRow
} from '../../../../composables/usePoStat'

const { t } = useI18n()
const { filterForm, summary, loading, fetchRoot, fetchChildren, resetFilter } = usePoStat()

const levelOptions: { label: string; value: PoStatLevel }[] = [
  { label: t('poStat.levelBrand'), value: 'brand' },
  { label: t('poStat.levelYear'), value: 'year' },
  { label: t('poStat.levelPo'), value: 'po' },
  { label: t('poStat.levelItem'), value: 'item' }
]

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'wclPoStatTable',
  height: '100%',
  pageSize: 100,
  columns: [
    {
      field: 'label',
      title: t('poStat.label'),
      minWidth: 220,
      treeNode: true
    },
    {
      field: 'orderedQty',
      title: t('poStat.orderedQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatPoStatQty(cellValue)
    },
    {
      field: 'receivedQty',
      title: t('poStat.receivedQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatPoStatQty(cellValue)
    },
    {
      field: 'pendingQty',
      title: t('poStat.pendingQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatPoStatQty(cellValue)
    },
    {
      field: 'amountCny',
      title: t('poStat.amountCny'),
      minWidth: 130,
      align: 'right',
      formatter: ({ cellValue }: any) => formatPoStatAmount(cellValue)
    },
    {
      field: 'amountHkd',
      title: t('poStat.amountHkd'),
      minWidth: 130,
      align: 'right',
      formatter: ({ cellValue }: any) => formatPoStatAmount(cellValue)
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
      loadMethod: async ({ row }: { row: PoStatRow }) => fetchChildren(row)
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

function disabledPoDateStart(date: Date) {
  return filterForm.poDateEnd ? dayjs(date).isAfter(filterForm.poDateEnd, 'day') : false
}
function disabledPoDateEnd(date: Date) {
  return filterForm.poDateStart ? dayjs(date).isBefore(filterForm.poDateStart, 'day') : false
}
function disabledEtaStart(date: Date) {
  return filterForm.expectedArrivalDateEnd
    ? dayjs(date).isAfter(filterForm.expectedArrivalDateEnd, 'day')
    : false
}
function disabledEtaEnd(date: Date) {
  return filterForm.expectedArrivalDateStart
    ? dayjs(date).isBefore(filterForm.expectedArrivalDateStart, 'day')
    : false
}

onMounted(() => {
  loadRoot()
})
</script>

<template>
  <DashboardCard :title="t('poStat.title')">
    <div class="po-stat">
      <div class="po-stat-summary" aria-label="summary">
        <span>{{ t('poStat.orderedQty') }}: {{ formatPoStatQty(summary.orderedQty) }}</span>
        <span>{{ t('poStat.receivedQty') }}: {{ formatPoStatQty(summary.receivedQty) }}</span>
        <span>{{ t('poStat.pendingQty') }}: {{ formatPoStatQty(summary.pendingQty) }}</span>
        <span>{{ t('poStat.amountCny') }}: {{ formatPoStatAmount(summary.amountCny) }}</span>
        <span>{{ t('poStat.amountHkd') }}: {{ formatPoStatAmount(summary.amountHkd) }}</span>
      </div>
      <div class="po-stat-table">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <ResponsiveCollapseFilter class="toolbar-filters">
              <ElSelect
                v-model="filterForm.level"
                :placeholder="t('poStat.level')"
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
                :placeholder="t('poStat.brand')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.yearFilter"
                :placeholder="t('poStat.yearFilter')"
                clearable
                class="filter-item filter-input filter-input--narrow"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.poNumber"
                :placeholder="t('poStat.poNumber')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.itemNo"
                :placeholder="t('poStat.itemNo')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElDatePicker
                v-model="filterForm.poDateStart"
                type="date"
                :placeholder="t('poStat.poDateStart')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledPoDateStart"
              />
              <ElDatePicker
                v-model="filterForm.poDateEnd"
                type="date"
                :placeholder="t('poStat.poDateEnd')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledPoDateEnd"
              />
              <ElDatePicker
                v-model="filterForm.expectedArrivalDateStart"
                type="date"
                :placeholder="t('poStat.expectedArrivalDateStart')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledEtaStart"
              />
              <ElDatePicker
                v-model="filterForm.expectedArrivalDateEnd"
                type="date"
                :placeholder="t('poStat.expectedArrivalDateEnd')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledEtaEnd"
              />
              <ElButton type="primary" :loading="loading" @click="handleFilter">
                {{ t('poStat.search') }}
              </ElButton>
              <ElButton @click="handleResetFilter">{{ t('poStat.reset') }}</ElButton>
            </ResponsiveCollapseFilter>
          </template>
        </VxeGrid>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.po-stat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.po-stat-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.po-stat-table {
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
  width: 120px;
}
.filter-input {
  width: 140px;
}
.filter-input--narrow {
  width: 100px;
}
.filter-date {
  width: 140px;
}
</style>
