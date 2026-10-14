<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  formatIncomingStatQty,
  useIncomingStat,
  type IncomingStatLevel,
  type IncomingStatRow
} from '../../../../composables/useIncomingStat'

const { t } = useI18n()
const { filterForm, summary, loading, fetchRoot, fetchChildren, resetFilter } =
  useIncomingStat()

const levelOptions: { label: string; value: IncomingStatLevel }[] = [
  { label: t('incomingStat.levelWarehouse'), value: 'warehouse' },
  { label: t('incomingStat.levelDeliveryDate'), value: 'delivery_date' },
  { label: t('incomingStat.levelBrand'), value: 'brand' },
  { label: t('incomingStat.levelItem'), value: 'item' },
  { label: t('incomingStat.levelPo'), value: 'po' }
]

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'wclIncomingStatTable',
  height: '100%',
  pageSize: 100,
  columns: [
    {
      field: 'label',
      title: t('incomingStat.label'),
      minWidth: 240,
      treeNode: true
    },
    {
      field: 'shipmentQty',
      title: t('incomingStat.shipmentQty'),
      minWidth: 120,
      align: 'right',
      formatter: ({ cellValue }: any) => formatIncomingStatQty(cellValue)
    },
    {
      field: 'carrier',
      title: t('incomingStat.carrier'),
      minWidth: 140
    },
    {
      field: 'trackingNo',
      title: t('incomingStat.trackingNo'),
      minWidth: 160
    },
    {
      field: 'status',
      title: t('incomingStat.status'),
      minWidth: 120
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
      loadMethod: async ({ row }: { row: IncomingStatRow }) => fetchChildren(row)
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

function disabledDeliveryDateStart(date: Date) {
  return filterForm.deliveryDateEnd
    ? dayjs(date).isAfter(filterForm.deliveryDateEnd, 'day')
    : false
}
function disabledDeliveryDateEnd(date: Date) {
  return filterForm.deliveryDateStart
    ? dayjs(date).isBefore(filterForm.deliveryDateStart, 'day')
    : false
}

onMounted(() => {
  loadRoot()
})
</script>

<template>
  <DashboardCard :title="t('incomingStat.title')">
    <div class="incoming-stat">
      <div class="incoming-stat-summary" aria-label="summary">
        <span>
          {{ t('incomingStat.shipmentQty') }}:
          {{ formatIncomingStatQty(summary.shipmentQty) }}
        </span>
      </div>
      <div class="incoming-stat-table">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <ResponsiveCollapseFilter class="toolbar-filters">
              <ElSelect
                v-model="filterForm.level"
                :placeholder="t('incomingStat.level')"
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
                :placeholder="t('incomingStat.warehouse')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElInput
                v-model="filterForm.brand"
                :placeholder="t('incomingStat.brand')"
                clearable
                class="filter-item filter-input"
                @keyup.enter="handleFilter"
              />
              <ElDatePicker
                v-model="filterForm.deliveryDateStart"
                type="date"
                :placeholder="t('incomingStat.deliveryDateStart')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledDeliveryDateStart"
              />
              <ElDatePicker
                v-model="filterForm.deliveryDateEnd"
                type="date"
                :placeholder="t('incomingStat.deliveryDateEnd')"
                value-format="YYYY-MM-DD"
                clearable
                class="filter-item filter-date"
                :disabled-date="disabledDeliveryDateEnd"
              />
              <ElButton type="primary" :loading="loading" @click="handleFilter">
                {{ t('incomingStat.search') }}
              </ElButton>
              <ElButton @click="handleResetFilter">{{ t('incomingStat.reset') }}</ElButton>
            </ResponsiveCollapseFilter>
          </template>
        </VxeGrid>
      </div>
    </div>
  </DashboardCard>
</template>

<style lang="scss" scoped>
.incoming-stat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: var(--app-space-s);
  overflow: hidden;
}
.incoming-stat-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-m);
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}
.incoming-stat-table {
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
