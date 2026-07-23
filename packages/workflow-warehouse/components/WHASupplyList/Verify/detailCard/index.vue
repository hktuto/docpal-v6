<template>
  <div class="detail-card">
    <template v-if="selectedInvoice">
      <div class="detail-card-body">
        <template v-for="item in list" :key="item.label">
          <WHASupplyListVerifyDetailCardItem
            v-if="item.invoiceKey"
            v-model:value="selectedInvoice[SGLA[item.invoiceKey]]"
            :label="item.label"
            :type="item.type"
            :disabled="item.disabled"
            :status="item.status"
            @save="(v) => handleSave(v, item)"
          />
          <template v-else>
            <WHASupplyListVerifyDetailCardItem :label="item.label" :textValue="item.value" :type="item.type" :disabled="item.disabled" />
          </template>
        </template>
      </div>
    </template>

    <el-empty v-else description="Select a sub-invoice" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { newClientApi } from 'api'
import { SGLA, SGLA_ITEMS } from '../../../../utils/variableMapping'

const { selectedInvoice, updateInvoiceData } = useWHASupplyListVerifyInject()
const { tableData } = useWHASupplyListVerifyTableInject()
const key = 'VendorName'
const list = ref([
  {
    invoiceKey: 'Name',
    type: 'text',
    status: 'pass'
  },
  {
    label: 'Supplier',
    invoiceKey: 'VendorName',
    type: 'text',
    status: 'pass'
  },
  {
    label: 'Customer',
    invoiceKey: 'CustomerName',
    type: 'text',
    status: 'pass'
  },
  {
    label: 'Delivery Date',
    invoiceKey: 'DeliveryDate',
    type: 'date',
    status: 'pass'
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
])

function getUniqueCartons() {
  try {
    return [...new Set(tableData.value.map((item) => item[SGLA_ITEMS.Carton]))].join(', ')
  } catch (error) {
    console.error(error)
    return '—'
  }
}
async function generateParams() {}
async function handleSave(value: string, item: any) {
  item.status = 'loading'
  const res = await updateInvoiceData(value, item.invoiceKey)
  setTimeout(() => {
    item.status = res.result ? 'pass' : 'fail'
  }, 1000)
}
async function validate() {
  const hasInvalid = list.value.some((item) => item.status === 'fail' || item.status === 'loading')
  if (!hasInvalid) return true
  try {
    await ElMessageBox.confirm('Some invoice data failed to submit. Force submit anyway?', 'Warning', {
      confirmButtonText: 'Force Submit',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    return true
  } catch {
    throw new Error('Please check the invoice data')
  }
}
defineExpose({
  validate
})
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
