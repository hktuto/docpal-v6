<script setup lang="ts">
import { useWHPOListInject } from '../../composables/useWHPOList'
import { CUST_PO, sumPoQuantity } from '../../utils/custPo'

const { poList, selectedPo, selectPo, loadPoList } = useWHPOListInject()

function getTotalQty(item: Record<string, any>) {
  if (item.total_qty != null) return item.total_qty
  return sumPoQuantity(item.items ?? [])
}

onMounted(() => {
  setTimeout(() => {
    loadPoList()
  })
})
</script>

<template>
  <WHInvoiceList
    :items="poList"
    :selected-id="selectedPo?.id"
    :name-key="CUST_PO.custPoNum"
    :status-key="CUST_PO.status"
    @select="selectPo"
  >
    <template #meta="{ item }">
      <span>{{ getTotalQty(item) || 0 }} {{ $t('workflowWarehouse.units') }}</span>
    </template>
  </WHInvoiceList>
</template>
