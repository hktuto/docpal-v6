<template>
  <div class="detail-card">
    <template v-if="selectedInvoice">
      <div class="detail-card-header">
        <h3 class="detail-card-title">{{ $t('workflowWarehouse.invoiceSummary') }}</h3>
      </div>
      <div class="detail-card-body">
        <template v-for="item in list" :key="item.label || item.field">
          <WHDetailItem
            v-if="item.field"
            v-model:value="selectedInvoice[item.field]"
            :label="item.label"
            :type="item.type"
            :disabled="item.disabled || disabled"
            :status="item.status"
            :options="unref(item.options) ?? []"
            :format="item.format"
            :required="item.required"
            @save="(v) => handleSave(v, item)"
          />
          <WHDetailItem
            v-else
            :label="item.label"
            :text-value="unref(item.value)"
            :type="item.type"
            :disabled="true"
          />
        </template>
      </div>
    </template>
    <el-empty v-else :description="$t('workflowWarehouse.selectSubInvoice')" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { newClientApi } from 'api'
import { ElMessageBox } from 'element-plus'
import { DELIVERY_DATE_FORMAT } from '../../../../utils/variableMapping'
import { useInvoiceVerifyInject } from '../../../../composables/useInvoiceVerify'
import { useInvoiceVerifyTableInject } from '../../../../composables/useInvoiceVerifyTable'

const { t } = useI18n()
const { selectedInvoice, updateInvoiceData, disabled } = useInvoiceVerifyInject()
const { tableData, statusCounts } = useInvoiceVerifyTableInject()
const OrgList = ref<Array<{ label: string; value: string | number; code?: string }>>([])

const list = ref([
  {
    field: 'invoiceNum',
    type: 'text',
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.supplier'),
    field: 'vendorName',
    type: 'text',
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.org'),
    field: 'orgId',
    required: true,
    type: 'select',
    valueType: 'number',
    status: 'pass',
    options: OrgList
  },
  {
    label: t('workflowWarehouse.gitDate'),
    field: 'gitDate',
    type: 'date',
    status: 'pass',
    format: DELIVERY_DATE_FORMAT
  },
  {
    label: t('workflowWarehouse.currency'),
    field: 'currency',
    type: 'text',
    status: 'pass'
  },
  {
    label: t('workflowWarehouse.fileName'),
    value: computed(() => selectedInvoice.value?.file?.file_name || selectedInvoice.value?.file?.name || selectedInvoice.value?.fileName || '—'),
    type: 'text'
  },
  {
    label: t('workflowWarehouse.totalQty'),
    value: computed(() => selectedInvoice.value?.totalQty ?? selectedInvoice.value?.total_qty ?? statusCounts.value.all),
    type: 'text'
  },
  {
    label: t('workflowWarehouse.totalAmount'),
    value: computed(() => selectedInvoice.value?.totalAmount ?? selectedInvoice.value?.total_amount ?? '—'),
    type: 'text'
  },
  {
    label: t('workflowWarehouse.lines'),
    value: computed(() => tableData.value.length),
    type: 'text'
  }
])

async function handleSave(value: string, item: any) {
  item.status = 'loading'
  if (!value) value = null as any
  const payloadValue = item.valueType === 'number' && value !== '' && value != null ? Number(value) : value
  const invoiceData: Record<string, any> = { [item.field]: payloadValue }
  if (item.field === 'orgId' && payloadValue != null) {
    const matched = OrgList.value.find((opt) => String(opt.value) === String(payloadValue))
    invoiceData.org = matched?.code ?? matched?.label ?? selectedInvoice.value?.org
  }
  try {
    const res = await updateInvoiceData(invoiceData)
    setTimeout(() => {
      item.status = res?.data?.id ? 'pass' : 'fail'
    }, 400)
  } catch (error) {
    console.error(error)
    item.status = 'fail'
  }
}

async function validate() {
  const hasInvalid = list.value.some((item) => item.status === 'fail' || item.status === 'loading')
  if (!hasInvalid) return true
  try {
    return await ElMessageBox.confirm(t('workflowWarehouse.forceSubmitConfirm'), t('dpTip_warning'), {
      confirmButtonText: t('workflowWarehouse.forceSubmit'),
      cancelButtonText: t('common_cancel'),
      type: 'warning'
    })
  } catch {
    return 'cancel'
  }
}

async function getOrgList() {
  try {
    const { data } = await newClientApi.getWmsOrganizationList()
    OrgList.value = data
      .map((item: any) => ({
        label: item.org_name || item.org_id,
        value: item.org_id,
        code: item.org ?? item.org_code ?? item.org_name
      }))
      .filter((item: any) => item.value)
  } catch (error) {
    console.error(error)
  }
}

function syncOrgField() {
  const invoice = selectedInvoice.value
  if (!invoice || !OrgList.value.length) return
  const orgId = invoice.orgId ?? invoice.org_id
  if (orgId != null && orgId !== '') {
    const matched = OrgList.value.find((opt) => String(opt.value) === String(orgId))
    if (matched) {
      invoice.orgId = matched.value as number
      invoice.org = matched.code ?? String(matched.label)
    }
    return
  }
  const orgCode = invoice.org
  if (!orgCode) return
  const matched = OrgList.value.find(
    (opt) => String(opt.code) === String(orgCode) || String(opt.label) === String(orgCode) || String(opt.value) === String(orgCode)
  )
  if (matched) {
    invoice.orgId = matched.value as number
    invoice.org = matched.code ?? String(orgCode)
  }
}

watch([() => selectedInvoice.value?.id, OrgList], () => syncOrgField(), { immediate: true })

onMounted(() => getOrgList())

defineExpose({ validate })
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
}

.detail-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  overflow: visible;
}
</style>
