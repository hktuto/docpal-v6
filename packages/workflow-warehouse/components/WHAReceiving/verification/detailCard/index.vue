<template>
  <div class="detail-card">
    <template v-if="selectedInvoice">
      <div class="detail-card-header">
        <h3 class="detail-card-title" :title="selectedInvoice[SGLA.Name]">
          {{ selectedInvoice[SGLA.Name] || '—' }}
        </h3>
        <p class="detail-card-subtitle">Sub-invoice summary — click to edit</p>
      </div>

      <div class="detail-card-body">
        <template v-for="item in list" :key="item.label">
          <WHAReceivingVerificationDetailCardItem
            v-if="item.invoiceValue"
            v-model:value="selectedInvoice[item.invoiceValue]"
            :label="item.label"
            :type="item.type"
            :disabled="item.disabled"
          />
          <template v-else>
            <WHAReceivingVerificationDetailCardItem :label="item.label" :textValue="item.value" :type="item.type" :disabled="item.disabled" />
          </template>
        </template>
      </div>
    </template>

    <el-empty v-else description="Select a sub-invoice" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { SGLA, SGLAItems } from '../../../../utils/variableMapping'

const { selectedInvoice } = useWHAReceivingVerificationInject()
const { tableData } = useWHAReceivingVerificationTableInject()

const list = [
  {
    label: 'Supplier',
    invoiceValue: SGLA.VendorName,
    type: 'text'
  },
  {
    label: 'Customer',
    invoiceValue: SGLA.CustomerName,
    type: 'text'
  },
  {
    label: 'Delivery Date',
    invoiceValue: SGLA.DeliveryDate,
    type: 'date'
  },
  {
    label: 'Cartons',
    value: computed(() => getUniqueCartons()),
    type: 'text',
    disabled: true
  },
  {
    label: 'Lines',
    value: computed(() => tableData.value.length),
    type: 'text',
    disabled: true
  }
]

function getUniqueCartons() {
  try {
    return [...new Set(tableData.value.map((item) => item[SGLAItems.Carton]))].join(', ')
  } catch (error) {
    console.error(error)
    return '—'
  }
}
</script>

<style scoped lang="scss">
.detail-card {
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.detail-card-header {
  margin-bottom: var(--app-space-m);
}

.detail-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card-subtitle {
  margin: var(--app-space-xxs) 0 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}

.detail-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}
</style>
