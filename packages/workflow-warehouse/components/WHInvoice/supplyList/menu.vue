<script setup lang="ts">
import { useInvoiceVerifyInject } from '../../../composables/useInvoiceVerify'

const { invoiceList, selectedInvoice, selectInvoice } = useInvoiceVerifyInject()

const listItems = computed(() =>
  invoiceList.value.map((item) => ({
    ...item,
    invoiceNum: item.invoiceNum ?? item.invoice_num,
    gitStatus: item.gitStatus ?? item.git_status,
    totalQty: item.totalQty ?? item.total_qty
  }))
)
</script>

<template>
  <WHInvoiceList
    :items="listItems"
    :selected-id="selectedInvoice?.id"
    name-key="invoiceNum"
    status-key="gitStatus"
    confirmed-status="MATCHED"
    @select="selectInvoice"
  >
    <template #meta="{ item }">
      {{ item.currency || '—' }} •
      <span>{{ item.totalQty || 0 }} {{ $t('workflowWarehouse.units') }}</span>
    </template>
  </WHInvoiceList>
</template>
