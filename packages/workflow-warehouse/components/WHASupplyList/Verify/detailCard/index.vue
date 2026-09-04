<template>
  <div class="detail-card">
    <template v-if="selectedInvoice">
      <div class="detail-card-body">
        <template v-for="item in list" :key="item.label">
          <WHDetailItem
            v-if="item.invoiceKey"
            v-model:value="selectedInvoice[SGLA[item.invoiceKey]]"
            :label="item.label"
            :type="item.type"
            :disabled="item.disabled || disabled"
            :status="item.status"
            :options="unref(item.options) ?? []"
            :button-text="item.buttonText"
            :button-title="item.buttonTitle"
            :format="item.format"
            :required="item.required"
            @save="(v) => handleSave(v, item)"
            @button="(v) => handleBotton(v, item)"
          />
          <template v-else>
            <WHDetailItem :label="item.label" :text-value="unref(item.value)" :type="item.type" :disabled="item.disabled" />
          </template>
        </template>
      </div>
    </template>

    <el-empty v-else :description="$t('workflowWarehouse.selectSubInvoice')" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { newClientApi, postDynamicActions } from 'api'
import { SGLA, SGLA_ITEMS, SUPPLIER_LIST_TABLE_NAME, DELIVERY_DATE_FORMAT } from '../../../../utils/variableMapping'
import { syncSelectField } from '../../../../utils/workflowHelper'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(isoWeek)
dayjs.extend(advancedFormat)

const { t } = useI18n()
const { selectedInvoice, updateInvoiceData, disabled } = useWHASupplyListVerifyInject()
const { tableData } = useWHASupplyListVerifyTableInject()
const SupplierList = ref([])
const OrgList = ref([])
const list = ref([
  {
    invoiceKey: 'Name',
    type: 'text',
    status: 'pass'
  },
  {
    label: t('workflowWarehouse.supplier'),
    invoiceKey: 'VendorId',
    required: true,
    type: 'select',
    status: 'pass',
    options: SupplierList
  },
  {
    label: t('workflowWarehouse.org'),
    invoiceKey: 'Org',
    required: true,
    type: 'select',
    valueType: 'number',
    status: 'pass',
    options: OrgList
  },
  {
    label: t('workflowWarehouse.deliveryDate'),
    invoiceKey: 'DeliveryDate',
    required: true,
    type: 'date',
    status: 'pass',
    buttonText: t('workflowWarehouse.apply'),
    buttonTitle: t('workflowWarehouse.updateAllDatecodes'),
    format: DELIVERY_DATE_FORMAT
  },
  {
    label: t('workflowWarehouse.cartons'),
    value: computed(() => getUniqueCartons()),
    type: 'text',
    disabled: true
  },
  {
    label: t('workflowWarehouse.lines'),
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
  if (!value) value = null
  const payload = item.valueType === 'number' && value !== '' && value != null ? Number(value) : value
  const invoiceData: Record<string, any> = { [SGLA[item.invoiceKey]]: payload }
  if (item.invoiceKey === 'VendorId' && !!payload) {
    const matched = SupplierList.value.find((opt) => String(opt.label) === String(payload) || String(opt.shortName) === String(payload))
    invoiceData[SGLA.VendorName] = matched?.label ?? null
  }
  const res = await updateInvoiceData(invoiceData)
  setTimeout(() => {
    item.status = res.result ? 'pass' : 'fail'
  }, 1000)
}
async function handleBotton(value: string, item: any) {
  if (item.invoiceKey === 'DeliveryDate') {
    // WW 需 advancedFormat + isoWeek，如 2026/07/31 → 3126
    const dateCode = dayjs(value, DELIVERY_DATE_FORMAT).format('WWYY')
    tableData.value.forEach((row) => {
      row[SGLA_ITEMS.DateCode] = dateCode
    })
  }
}
async function validate() {
  const hasInvalid = list.value.some((item) => item.status === 'fail' || item.status === 'loading')
  if (!hasInvalid) return true
  try {
    const result = await ElMessageBox.confirm(t('workflowWarehouse.forceSubmitConfirm'), t('dpTip_warning'), {
      confirmButtonText: t('workflowWarehouse.forceSubmit'),
      cancelButtonText: t('common_cancel'),
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
      columns: [{ name: 'name' }, { name: 'short_name' }, { name: 'code' }],
      orderBy: [{ column: 'name', desc: false }]
    }
    const { data } = await postDynamicActions(params)
    SupplierList.value =
      data?.data.map((item: any) => ({
        label: item.name,
        value: item.code,
        shortName: item.short_name
      })) ?? []
  } catch (error) {
    console.error(error)
    return []
  } finally {
  }
}
async function getOrgList() {
  try {
    const { data } = await newClientApi.getWmsOrganizationList()
    OrgList.value = data
      .map((item: any) => ({
        label: item.organization_code || item.org_id,
        value: item.org_id
      }))
      .filter((item) => item.value)
  } catch (error) {
    console.error(error)
  } finally {
  }
}
watch(
  [() => selectedInvoice.value?.id, SupplierList, OrgList],
  () => {
    const invoice = selectedInvoice.value
    if (!invoice) return
    invoice[SGLA.VendorId] = syncSelectField(invoice[SGLA.VendorId], SupplierList.value)
    invoice[SGLA.Org] = syncSelectField(invoice[SGLA.Org], OrgList.value)
  },
  { immediate: true }
)

onMounted(async () => {
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
