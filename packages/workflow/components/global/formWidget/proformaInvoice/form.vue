<script setup lang="ts">
import { useUserState } from '@packages/authApp/composables/useAuth'
import { clientApi } from 'api'
import dayjs from 'dayjs'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
const isApproval = ref<boolean>(false)
const isReview = ref<boolean>(false)
const formRef = ref()
const formModel = reactive<{
  pi_number: string
  status: string
  invoice_date: number
  schedule_date: number
  customer_code: string
  customer_name: string
  office: string
  invoice_header: string
  currency: 'CNY' | 'USD' | 'HKD' | 'EUR' | 'JPY' | 'AUD' | 'MOP' | 'THB'
  sub_total: number
  total_tax: number
  total_amount: number
  warehouse_location: string
  sub_inventory: string
  payment_in_adv: 'Y' | 'N'
  overdue_debt: 'Y' | 'N'
  pi_remarks: string
  submitted_by: string
  submitted_date: number
  reject_reason: string
  approver: string
  approval_date: string
  items: {
    id: string
    schedule_date: number
    order_ln: number
    order_number: string
    wcl_part_number: string
    order_qty: number
    line_amount: number
    tax_code: string
    status: string
  }[]
}>({
  pi_number: '',
  status: '',
  invoice_date: 0,
  schedule_date: 0,
  customer_code: '',
  customer_name: '',
  office: '',
  invoice_header: '',
  currency: 'CNY',
  sub_total: 0,
  total_tax: 0,
  total_amount: 0,
  warehouse_location: '',
  sub_inventory: '',
  payment_in_adv: 'Y',
  overdue_debt: 'Y',
  pi_remarks: '',
  submitted_by: '',
  submitted_date: 0,
  reject_reason: '',
  approver: '',
  approval_date: '',
  items: []
})

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoiceForm',
  api: () => {
    return formModel.items
  },
  columns: [
    {
      field: 'index',
      title: t('proformaInvoice.index'),
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'schedule_date',
      title: t('proformaInvoice.scheduleDate'),
      minWidth: 240,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'order_ln',
      title: t('proformaInvoice.orderLn'),
      minWidth: 240
    },
    {
      field: 'order_number',
      title: t('proformaInvoice.orderNumber'),
      minWidth: 240
    },
    {
      field: 'wcl_part_number',
      title: t('proformaInvoice.wclPartNumber'),
      minWidth: 240
    },
    {
      field: 'order_qty',
      title: t('proformaInvoice.orderQty'),
      minWidth: 240
    },
    {
      field: 'line_amount',
      title: t('proformaInvoice.lineAmount'),
      minWidth: 240
    },
    {
      field: 'tax_code',
      title: t('proformaInvoice.taxCode'),
      minWidth: 240
    },
    {
      field: 'status',
      title: t('proformaInvoice.status'),
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
    if (!row || isApproval.value) {
      return { visible: false, disabled: false }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})

function handleDelete(row: any) {
  formModel.items = formModel.items.filter((item: any) => item.id !== row.id)
  reload()
}

async function init() {
  try {
    // const data = await clientApi.instance.get(`/apis/v1/ms/wfl/proforma-invoices/${formData.pi_number}`)
    const data: any = await clientApi.instance.get(`/apis/v1/ms/wfl/proforma-invoices/SZ2609-0009`).then((r) => r.data)
    console.log(123, data)

    const { subTotal, totalTax } = data.lines.reduce(
      (acc: any, item: any) => ({
        subTotal: acc.subTotal.plus(item.lineAmount),
        totalTax: acc.totalTax.plus(item.taxValue)
      }),
      { subTotal: new Decimal(0), totalTax: new Decimal(0) }
    )

    const totalAmount = subTotal.plus(totalTax).toNumber()

    Object.assign(formModel, {
      pi_number: data.piNum ?? '',
      status: data.status ?? '',
      invoice_date: data.invoice_date ?? '',
      schedule_date: data.schedule_date ?? '',
      customer_code: data.customerNumber ?? '',
      customer_name: data.customerName ?? '',
      office: data.companyTitle ?? '',
      org_id: data.orgId,
      invoice_header: formData.invoice_header ?? '',
      currency: formData.currency ?? '',
      sub_total: subTotal ?? 0,
      total_tax: totalTax ?? 0,
      total_amount: totalAmount ?? 0,
      warehouse_location: formData.warehouse_location ?? '',
      sub_inventory: formData.sub_inventory ?? '',
      payment_in_adv: formData.payment_in_adv ?? '',
      overdue_debt: formData.overdue_debt ?? '',
      pi_remarks: formData.remarks ?? '',
      items: data.lines ?? []
    })

    if (formData.is_approval) {
      isApproval.value = formData.is_approval
      formModel.reject_reason = ''
      formModel.approver = userInfo.value.userId
      formModel.approval_date = dayjs().format('YYYY-MM-DD')
      formModel.submitted_by = formData.submitted_by ?? ''
      formModel.submitted_date = formData.submitted_date
    } else {
      isReview.value = formData.is_review
      formModel.reject_reason = formData.reject_reason
      formModel.approver = formData.approver
      formModel.approval_date = formData.approval_date
    }
  } catch (e) {
    console.log(e)
  }
}

watch(
  () => formData,
  (value) => {
    if (!value) return
    init()
  },
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

const userInfo = ref<{
  org_id: number
  office: string
  operatingName: string
  userId: string
}>({
  org_id: 0,
  office: '',
  operatingName: '',
  userId: ''
})

function getUserInfo() {
  const user = useUserState()

  if (user.value.org.length === 0) return

  const org = user.value.org[0]
  userInfo.value.org_id = Number(org.operatingId)
  userInfo.value.operatingName = org.operatingName
  userInfo.value.userId = org.userId
  userInfo.value.office = org.operatingName
}

onMounted(() => {
  // if (!!formData) return
  getUserInfo()

  // formModel.pi_number = '1234567890'
  // formModel.status = '1234567890'
  // formModel.invoice_date = 1790155908490
  // formModel.schedule_date = 1790155908490
  // formModel.customer_code = '1234567890'
  // formModel.customer_name = '1234567890'
  // formModel.office = '1234567890'
  // formModel.invoice_header = 'SZ'
  // formModel.currency = 'CNY'
  // formModel.sub_total = 1234567890
  // formModel.total_tax = 1234567890
  // formModel.total_amount = 1234567890
  // formModel.warehouse_location = '1234567890'
  // formModel.sub_inventory = '1234567890'
  // formModel.payment_in_adv = 'N'
  // formModel.overdue_debt = 'N'
  // formModel.pi_remarks = '1234567890'
  // formModel.items = [
  //   {
  //     id: '11',
  //     schedule_date: 1790155908490,
  //     order_ln: 1,
  //     order_number: '1234567890',
  //     wcl_part_number: '1234567890',
  //     order_qty: 1,
  //     line_amount: 1,
  //     tax_code: '1234567890',
  //     status: 'aaa'
  //   }
  // ]
})

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }
  return { ...formModel }
}

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" :model="formModel" label-position="top" class="all-input-style">
    <div class="info-item-card">
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
            <el-date-picker v-model="formModel.invoice_date" type="date" format="YYYY/MM/DD" value-format="x" disabled />
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
            <el-date-picker v-model="formModel.schedule_date" type="date" format="YYYY/MM/DD" value-format="x" disabled />
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
          <el-form-item v-if="isApproval" :label="t('proformaInvoice.submittedBy')">
            <el-input v-model="formModel.submitted_by" disabled />
          </el-form-item>
          <el-form-item v-if="isReview" :label="t('proformaInvoice.approver')">
            <el-input v-model="formModel.approver" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item v-if="isApproval" :label="t('proformaInvoice.submittedDate')">
            <el-date-picker v-model="formModel.submitted_date" type="date" format="YYYY/MM/DD" value-format="x" disabled />
          </el-form-item>
          <el-form-item v-if="isReview" :label="t('proformaInvoice.approvalDate')">
            <el-date-picker v-model="formModel.approval_date" type="date" format="YYYY/MM/DD" value-format="x" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </el-form>

  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <span style="font-size: 20px; color: #2354b8">{{ t('proformaInvoice.lineItems') }}</span>
      </template>
    </VxeGrid>
  </div>

  <div v-if="isApproval || isReview">
    <el-divider content-position="left" />
    <el-form-item :label="t('proformaInvoice.rejectReason')">
      <el-input type="textarea" v-model="formModel.reject_reason" :autosize="{ minRows: 2, maxRows: 4 }" :disabled="!isApproval" />
    </el-form-item>
  </div>
</template>

<style scoped lang="scss">
.info-item-card {
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-s);
  margin-top: var(--app-space-s);
}

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
