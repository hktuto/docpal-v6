<script setup lang="ts">
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
const isApproval = ref<boolean>(false)
const formRef = ref()
const formModel = reactive({
  pi_number: '',
  status: '',
  invoice_date: '',
  schedule_date: '',
  customer_code: '',
  customer_name: '',
  office: '',
  invoice_header: '',
  currency: '',
  sub_total: '',
  total_tax: '',
  total_amount: '',
  warehouse_location: '',
  sub_inventory: '',
  payment_in_adv: '',
  overdue_debt: '',
  pi_remarks: '',
  submitted_by: '',
  submitted_date: '',
  reject_reason: ''
})

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoiceInfoTable',
  api: () => {
    return []
  },
  columns: [
    {
      field: 'index',
      title: 'Ln',
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'schedule_date',
      title: 'Schedule Date 預定日期',
      minWidth: 240
    },
    {
      field: 'order_ln',
      title: 'Order Ln 订单行号',
      minWidth: 240
    },
    {
      field: 'order_number',
      title: 'Order Number 订单编号',
      minWidth: 240
    },
    {
      field: 'wcl_part_number',
      title: 'WCL Part Number WCL料号',
      minWidth: 240
    },
    {
      field: 'order_qty',
      title: 'Order Qty 订单数量',
      minWidth: 240
    },
    {
      field: 'line_amount',
      title: 'Line Amount 行金额',
      minWidth: 240
    },
    {
      field: 'tax_code',
      title: 'Tax Code 税码',
      minWidth: 240
    },
    {
      field: 'status',
      title: 'Status 状态',
      minWidth: 240
    }
  ],
  zoom: false,
  refresh: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  selectChangeHander: (_selectedRows: any[]) => {},
  bodyActions: [
    [
      {
        code: 'Delete',
        name: t('common_delete'),
        action: ({ row }: { row: any }) => {
          handleDelete(row)
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})

function handleDelete(row: any) {
  console.log(row)
}

function init() {
  Object.assign(formModel, {
    pi_number: formData.pi_number ?? formData.pi_invoice_number ?? '',
    status: formData.status ?? '',
    invoice_date: formData.invoice_date ?? '',
    schedule_date: formData.schedule_date ?? '',
    customer_code: formData.customer_code ?? formData.customer_number ?? '',
    customer_name: formData.customer_name ?? '',
    office: formData.office ?? '',
    invoice_header: formData.invoice_header ?? '',
    currency: formData.currency ?? '',
    sub_total: formData.sub_total ?? '',
    total_tax: formData.total_tax ?? '',
    total_amount: formData.total_amount ?? '',
    warehouse_location: formData.warehouse_location ?? '',
    sub_inventory: formData.sub_inventory ?? '',
    payment_in_adv: formData.payment_in_adv ?? formData.cod ?? '',
    overdue_debt: formData.overdue_debt ?? '',
    pi_remarks: formData.pi_remarks ?? formData.remarks ?? '',
    submitted_by: formData.submitted_by ?? '',
    submitted_date: formData.submitted_date ?? ''
  })
}

watch(
  () => formData,
  () => init(),
  { immediate: true, deep: true }
)

const invoiceHeaderOption = ref<any[]>([
  { label: '创能', value: 'SZ' },
  { label: '意堡', value: 'GZ' },
  { label: '能意恒', value: 'SH' },
  { label: '伟创达', value: 'BJ' },
  { label: '创意', value: 'HK' },
  { label: '金领导', value: 'JLD' },
  { label: 'MCE', value: 'MCE' }
])

onMounted(() => {})

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }
  return { ...formModel }
}

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" :model="formModel" label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.piNumber')">
          <el-input v-model="formModel.pi_number" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.customerCode')">
          <el-input v-model="formModel.customer_code" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.currency')">
          <el-input v-model="formModel.currency" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.warehouseLocation')">
          <el-input v-model="formModel.warehouse_location" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.status')">
          <el-input v-model="formModel.status" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.customerName')">
          <el-input v-model="formModel.customer_name" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.subTotal')">
          <el-input v-model="formModel.sub_total" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.subInventory')">
          <el-input v-model="formModel.sub_inventory" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.invoiceDate')">
          <el-input v-model="formModel.invoice_date" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.office')">
          <el-input v-model="formModel.office" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.totalTax')">
          <el-input v-model="formModel.total_tax" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.paymentInAdv')">
          <el-input v-model="formModel.payment_in_adv" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.scheduleDate')">
          <el-input v-model="formModel.schedule_date" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.invoiceHeader')">
          <el-select v-model="formModel.invoice_header" :disabled="isApproval">
            <el-option v-for="item in invoiceHeaderOption" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.totalAmount')">
          <el-input v-model="formModel.total_amount" disabled />
        </el-form-item>
        <el-form-item :label="t('proformaInvoice.overdueDebt')">
          <el-input v-model="formModel.overdue_debt" disabled />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item :label="t('proformaInvoice.piRemarks')">
          <el-input v-model="formModel.pi_remarks" :disabled="isApproval" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.submittedBy')">
          <el-input v-model="formModel.submitted_by" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('proformaInvoice.submittedDate')">
          <el-input v-model="formModel.submitted_date" disabled />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <el-divider content-position="left">Line Items</el-divider>
      </template>
    </VxeGrid>
  </div>

  <el-divider content-position="left" />
  <el-form-item label="驳回原因 Reject Reason">
    <el-input type="textarea" v-model="formModel.reject_reason" :autosize="{ minRows: 2, maxRows: 4 }" />
  </el-form-item>
</template>

<style scoped lang="scss">
.table-container {
  min-height: 550px;
  max-height: 600px;
  overflow: auto;

  margin-block-end: 20px;
}

.all-input-style {
  :deep(.el-select),
  :deep(.el-input) {
    width: 98%;
  }
}
</style>
