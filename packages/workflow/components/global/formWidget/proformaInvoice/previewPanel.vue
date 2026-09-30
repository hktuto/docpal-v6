<script setup lang="ts">
const invoice = defineModel<any>('invoice', { required: true })
const { t } = useI18n()

const invoiceHeaderOption = [
  { label: '创能', value: 'SZ' },
  { label: '意堡', value: 'GZ' },
  { label: '能意恒', value: 'SH' },
  { label: '伟创达', value: 'BJ' },
  { label: '创意', value: 'HK' },
  { label: '金领导', value: 'JLD' },
  { label: 'MCE', value: 'MCE' }
]

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoicePreview',
  api: () => invoice.value?.items ?? [],
  columns: [
    { field: 'index', title: t('proformaInvoice.index'), align: 'center', type: 'seq', width: 70 },
    {
      field: 'schedule_date',
      title: t('proformaInvoice.scheduleDate'),
      minWidth: 140,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'order_ln', title: t('proformaInvoice.orderLn'), minWidth: 100 },
    { field: 'order_number', title: t('proformaInvoice.orderNumber'), minWidth: 140 },
    { field: 'wcl_part_number', title: t('proformaInvoice.wclPartNumber'), minWidth: 160 },
    { field: 'order_qty', title: t('proformaInvoice.orderQty'), minWidth: 110 },
    { field: 'lineAmount', title: t('proformaInvoice.lineAmount'), minWidth: 120 },
    { field: 'tax_code', title: t('proformaInvoice.taxCode'), minWidth: 100 },
    { field: 'status', title: t('proformaInvoice.status'), minWidth: 100 }
  ],
  zoom: false,
  refresh: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  selectChangeHander: () => {},
  bodyActions: [],
  permissionMethod: () => ({ visible: false, disabled: false })
})

function formatAmount(value: number | string | undefined) {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return String(value ?? '')
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

watch(
  () => invoice.value,
  () => nextTick(() => reload()),
  { deep: false }
)

defineExpose({ reload })
</script>

<template>
  <div class="pi-preview-panel">
    <el-form :model="invoice" label-position="top" class="pi-preview-panel__form">
      <el-row :gutter="12">
        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.customerCode')">
            <el-input :model-value="invoice.customer_code" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.currency')">
            <el-input :model-value="invoice.currency" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.warehouseLocation')">
            <el-input :model-value="invoice.warehouseLocation" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.customerName')">
            <el-input :model-value="invoice.customer_name" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.subTotal')">
            <el-input :model-value="formatAmount(invoice.sub_total)" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.subInventory')">
            <el-input :model-value="invoice.sub_inventory" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.office')">
            <el-input :model-value="invoice.office" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.totalTax')">
            <el-input :model-value="formatAmount(invoice.total_tax)" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.paymentInAdv')">
            <el-input :model-value="invoice.payment_in_adv" disabled />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.invoiceHeader')">
            <el-select v-model="invoice.invoice_header">
              <el-option v-for="item in invoiceHeaderOption" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.totalAmount')">
            <el-input :model-value="formatAmount(invoice.total_amount)" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.overdueDebt')">
            <el-input :model-value="invoice.overdue_debt" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('proformaInvoice.piRemarks')">
            <el-input v-model="invoice.pi_remarks" type="textarea" :autosize="{ minRows: 1, maxRows: 2 }" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.invoiceDate')">
            <el-date-picker v-model="invoice.invoice_date" type="date" format="YYYY/MMM/DD" value-format="YYYY-MM-DD" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
  <div class="pi-preview-panel__table">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <span class="pi-preview-panel__table-title">{{ t('proformaInvoice.lineItems') }}</span>
      </template>
    </VxeGrid>
  </div>
</template>

<style scoped lang="scss">
.pi-preview-panel {
  &__form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item__label) {
      color: var(--app-text-secondary);
      line-height: 1.3;
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100%;
    }
  }

  &__edit-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .el-icon {
      color: var(--app-primary-color);
    }
  }
}

.pi-preview-panel__table {
  height: 30vh;
  overflow-y: auto;

  &__table-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e3a5f;
  }
}
</style>
