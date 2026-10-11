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
const isApproval = ref<boolean>(true)
const isReview = ref<boolean>(false)
const formRef = ref()
const formModel = reactive<{
  orgId: string
  companyTitle: string
  customerId: number
  customerName: string
  organizationId: number
  initialPickupLocationId: number
  ultimateDropoffLocationId: number
  freightTermsCode: string
  operatorId: string
  operatorName: string

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
  orgId: '',
  companyTitle: '',
  customerId: 0,
  customerName: '',
  organizationId: 0,
  initialPickupLocationId: 0,
  ultimateDropoffLocationId: 0,
  freightTermsCode: '',
  operatorId: '',
  operatorName: '',

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
  formModel.pi_number = formData.pi_number
  formModel.status = formData.status
  formModel.submitted_by = formData.__system__user_creator_name
  formModel.payment_in_adv = formData.payment_in_adv
  formModel.overdue_debt = formData.overdue_debt
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
  getUserInfo()
})

async function getFormData(needValidation = true, buttonName: string) {
  const result = {
    orgId: formModel.orgId,
    companyTitle: formModel.companyTitle,
    customerId: formModel.customerId,
    customerName: formModel.customerName,
    organizationId: formModel.organizationId,
    initialPickupLocationId: formModel.initialPickupLocationId,
    ultimateDropoffLocationId: formModel.ultimateDropoffLocationId,
    freightTermsCode: formModel.freightTermsCode,
    operatorId: formModel.operatorId,
    operatorName: formModel.operatorName,
    formPayload: {},
    lines: [
      {
        lineNo: 1,
        soLineId: 1001,
        deliveryDetailId: 11,
        orderNumber: 90001,
        lineNum: '1.1',
        partNum: 'PART-A',
        orderQty: 10,
        subinventory: 'FG',
        grouping: 1,
        customerId: 501,
        orgId: 7,
        organizationId: 160,
        scheduleDate: '2026-09-18',
        currencyCode: 'USD',
        taxCode: 'VAT',
        taxValue: 12.5,
        lineAmount: 128.0,
        customerNumber: 'C501',
        customerName: 'ACME',
        billToAddress: 'Bill Addr',
        shipToAddress: 'Ship Addr',
        initialPickupLocationId: 1001,
        ultimateDropoffLocationId: 2002,
        companyTitle: 'SZ',
        warehouseLocation: 'SZ',
        freightTermsCode: 'FOB'
      }
    ]
  }
  if (!needValidation) return result

  return result
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
