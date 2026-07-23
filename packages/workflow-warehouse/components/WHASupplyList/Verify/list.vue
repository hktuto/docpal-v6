<script setup lang="ts">
import { postDynamicActions } from 'api'
import { SGLA, SGLA_TABLE_ID, SGLA_ITEMS_TABLE_ID, SGLA_ITEMS } from '../../../utils/variableMapping'

const { formData, invoiceList, selectedInvoice, selectInvoice } = useWHASupplyListVerifyInject()

function buildInvoiceParams(batchId: string) {
  return {
    tableId: SGLA_TABLE_ID,
    columns: [{ name: '*' }],
    conditions: [
      {
        value: [{ column: SGLA.BatchId, type: 'EQ', value: batchId }],
        type: 'AND'
      }
    ]
  }
}
function buildInvoiceAggParams(masterId: string) {
  return {
    tableId: SGLA_ITEMS_TABLE_ID,
    columns: [
      {
        name: SGLA_ITEMS.Qty,
        alias: `agg_${SGLA_ITEMS.Qty}`,
        aggFunc: 'SUM'
      }
    ],
    conditions: [
      {
        value: [
          {
            column: SGLA_ITEMS.MasterId,
            type: 'EQ',
            value: masterId
          }
        ],
        type: 'AND'
      }
    ]
  }
}
async function loadInvoiceList() {
  const batchId = formData.value?.batch_no
  if (!batchId) {
    invoiceList.value = []
    return
  }

  try {
    const { data } = await postDynamicActions(buildInvoiceParams(batchId))
    const invoiceDatas = (data.data ?? []).map((item: Record<string, any>) => ({
      ...item,
      total_qty: undefined as number | undefined
    }))
    invoiceList.value = invoiceDatas
    if (invoiceList.value.length > 0) {
      selectInvoice(invoiceList.value[0])
    }
    // 异步回填数量：必须改 invoiceList 里的响应式对象，才会触发重渲
    invoiceList.value.forEach(async (item) => {
      const { data: aggData } = await postDynamicActions(buildInvoiceAggParams(item.id))
      item.total_qty = aggData.data[0]?.[`agg_${SGLA_ITEMS.Qty}`]
    })
  } catch (error) {
    console.error(error)
    invoiceList.value = []
  }
}

function handleSelect(item: Record<string, any>) {
  selectInvoice(item)
}

function handleKeydown(event: KeyboardEvent, item: Record<string, any>) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectInvoice(item)
  }
}

onMounted(() => {
  setTimeout(() => {
    loadInvoiceList()
  })
})
</script>

<template>
  <div class="invoice-list">
    <div
      v-for="item in invoiceList"
      :key="item.id"
      class="invoice-card"
      :class="{ 'is-selected': selectedInvoice?.id === item.id }"
      role="button"
      tabindex="0"
      :aria-label="item[SGLA.Name]"
      :title="item[SGLA.Name]"
      @click="handleSelect(item)"
      @keydown="handleKeydown($event, item)"
    >
      <div class="invoice-card-body">
        <div class="invoice-card-name">{{ item[SGLA.Name] }}</div>
        <div v-if="item[SGLA.Total_Ctn]" class="invoice-card-meta">{{ item[SGLA.Total_Ctn] }} cartons

          <span v-if="item.total_qty" class="invoice-card-meta-qty">•{{ item.total_qty }} units</span>
        </div>
      </div>
      <span v-if="item[SGLA.Status] === 'confirm'" class="invoice-card-badge">OK</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.invoice-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  width: 100%;
  overflow: auto;
}

.invoice-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-xs);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--app-border-radius-s);
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.invoice-card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.invoice-card-name {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-card-meta {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-card-badge {
  position: absolute;
  top: -1px;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  width: 2rem;
  height: 1.45rem;
  padding: 0.2rem 0.2rem 0 0;
  border-radius: 0;
  background-color: transparent;
  color: var(--el-color-success);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--el-color-success-light-9);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }
}
</style>
