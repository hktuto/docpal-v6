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
            :options="unref(item.options) ?? []"
            @save="(v) => handleSave(v, item)"
          />
          <template v-else>
            <WHASupplyListVerifyDetailCardItem :label="item.label" :text-value="unref(item.value)" :type="item.type" :disabled="item.disabled" />
          </template>
        </template>
      </div>
    </template>

    <el-empty v-else description="Select a sub-invoice" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { newClientApi, postDynamicActions } from 'api'
import { SGLA, SGLA_ITEMS, SUPPLIER_LIST_TABLE_NAME } from '../../../../utils/variableMapping'
import { ElMessageBox } from 'element-plus'
const { selectedInvoice, updateInvoiceData } = useWHASupplyListVerifyInject()
const { tableData } = useWHASupplyListVerifyTableInject()
const key = 'VendorName'
const SupplierList = ref([])
const OrgList = ref([])
const list = ref([
  {
    invoiceKey: 'Name',
    type: 'text',
    status: 'pass'
  },
  {
    label: 'Supplier',
    invoiceKey: 'VendorName',
    type: 'select',
    status: 'pass',
    options: SupplierList
  },
  {
    label: 'Org',
    invoiceKey: 'Org',
    type: 'select',
    valueType: 'number',
    status: 'pass',
    options: OrgList
  },
  {
    label: 'Delivery Date',
    invoiceKey: 'DeliveryDate',
    // type: 'date',
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
  const payload = item.valueType === 'number' && value !== '' && value != null ? Number(value) : value
  const res = await updateInvoiceData(payload, item.invoiceKey)
  setTimeout(() => {
    item.status = res.result ? 'pass' : 'fail'
  }, 1000)
}
async function validate() {
  const hasInvalid = list.value.some((item) => item.status === 'fail' || item.status === 'loading')
  if (!hasInvalid) return true
  try {
    const result = await ElMessageBox.confirm('Some invoice data failed to submit. Force submit anyway?', 'Warning', {
      confirmButtonText: 'Force Submit',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    return result
  } catch {
    return 'cancel'
  }
}
async function getSupplierList() {
  try {
    const params = {
      table: SUPPLIER_LIST_TABLE_NAME,
      columns: [{ name: 'short_name' }, { name: 'code' }],
      orderBy: [{ column: 'short_name', desc: false }]
    }
    const { data } = await postDynamicActions(params)
    SupplierList.value =
      data?.data.map((item: any) => ({
        label: item.short_name,
        value: item.code
      })) ?? []
    if (selectedInvoice.value[SGLA.VendorName]) {
      const matched = SupplierList.value.find(
        (opt) => String(opt.value) === String(selectedInvoice.value[SGLA.VendorName]) || String(opt.label) === String(selectedInvoice.value[SGLA.VendorName])
      )
      if (matched) {
        selectedInvoice.value[SGLA.VendorName] = matched.value
      } else {
        selectedInvoice.value[SGLA.VendorName] = ''
      }
    }
  } catch (error) {
    console.error(error)
    return []
  } finally {
  }
}
async function getOrgList() {
  try {
    const { data } = await newClientApi.getWmsOrganizationList()
    OrgList.value = data.map((item: any) => ({
      label: item.org_name || item.org_id,
      value: item.org_id
    })).filter(item => item.value)
  } catch (error) {
    console.error(error)
  } finally {
  }
}
onMounted(async () => {
  console.log('getSupplierList')
  await getSupplierList()
  await getOrgList()
})
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
  overflow: visible;
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
  overflow: visible;
}
</style>
