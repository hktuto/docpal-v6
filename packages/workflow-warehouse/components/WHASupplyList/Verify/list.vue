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
    invoiceList.value.forEach(async (item) => {
      const { data: aggData } = await postDynamicActions(buildInvoiceAggParams(item.id))
      item.total_qty = aggData.data[0]?.[`agg_${SGLA_ITEMS.Qty}`]
    })
  } catch (error) {
    console.error(error)
    invoiceList.value = []
  }
}

onMounted(() => {
  setTimeout(() => {
    loadInvoiceList()
  })
})
</script>

<template>
  <WHInvoiceList
    :items="invoiceList"
    :selected-id="selectedInvoice?.id"
    :name-key="SGLA.Name"
    :status-key="SGLA.Status"
    @select="selectInvoice"
  >
    <template #meta="{ item }">
      {{ item[SGLA.Total_Ctn] || 0 }} {{ $t('workflowWarehouse.cartonsUnit') }} •
      <span>{{ item.total_qty || 0 }} {{ $t('workflowWarehouse.units') }}</span>
    </template>
  </WHInvoiceList>
</template>
