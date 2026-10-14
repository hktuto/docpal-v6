<script setup lang="ts">
import { useUserState } from '@packages/authApp/composables/useAuth'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
const formRef = ref()
const formModel = reactive<{
  orgId: string
  companyTitle: string
  customerId: number
  organizationId: number
  initialPickupLocationId: number
  ultimateDropoffLocationId: number
  freightTermsCode: string
  operatorId: string
  operatorName: string
  pi_number: string
  status: string
  invoice_date: number
  scheduleDate: number
  customerNumber: string
  customerName: string
  office: string
  invoice_header: string
  currencyCode: 'CNY' | 'USD' | 'HKD' | 'EUR' | 'JPY' | 'AUD' | 'MOP' | 'THB'
  sub_total: number
  total_tax: number
  total_amount: number
  warehouse_location: string
  subinventory: string
  payment_in_adv: 'Y' | 'N'
  overdue_debt: 'Y' | 'N'
  pi_remarks: string
  submitted_by: string
  submitted_date: string
  reject_reason: string
  approver: string
  approval_date: string
  lines: {
    lineNo: number
    soLineId: number
    deliveryDetailId: number
    orderNumber: number
    lineNum: string
    subinventory: string
    grouping: number
    customerId: number
    orgId: number
    organizationId: number
    scheduleDate: string
    currencyCode: string
    taxCode: string
    taxValue: number
    lineAmount: number
    customerNumber: string
    customerName: string
    billToAddress: string
    shipToAddress: string
    initialPickupLocationId: number
    ultimateDropoffLocationId: number
    companyTitle: string
    warehouseLocation: string
    freightTermsCode: string
    status: string
  }[]
}>({
  orgId: '',
  companyTitle: '',
  customerId: 0,
  organizationId: 0,
  initialPickupLocationId: 0,
  ultimateDropoffLocationId: 0,
  freightTermsCode: '',
  operatorId: '',
  operatorName: '',
  pi_number: '',
  status: '',
  invoice_date: 0,
  scheduleDate: 0,
  customerNumber: '',
  customerName: '',
  office: '',
  invoice_header: '',
  currencyCode: 'CNY',
  sub_total: 0,
  total_tax: 0,
  total_amount: 0,
  warehouse_location: '',
  subinventory: '',
  payment_in_adv: 'Y',
  overdue_debt: 'Y',
  pi_remarks: '',
  submitted_by: '',
  submitted_date: '',
  reject_reason: '',
  approver: '',
  approval_date: '',
  lines: []
})

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoiceApprovalForm',
  api: () => {
    return formModel.lines
  },
  columns: [
    {
      field: 'lineNo',
      title: t('proformaInvoice.index'),
      align: 'center',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'scheduleDate',
      title: t('proformaInvoice.scheduleDate'),
      minWidth: 240,
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'lineNum',
      title: t('proformaInvoice.orderLn'),
      minWidth: 240
    },
    {
      field: 'orderNumber',
      title: t('proformaInvoice.orderNumber'),
      minWidth: 240
    },
    {
      field: 'partNum',
      title: t('proformaInvoice.wclPartNumber'),
      minWidth: 240
    },
    {
      field: 'orderQty',
      title: t('proformaInvoice.orderQty'),
      minWidth: 240
    },
    {
      field: 'lineAmount',
      title: t('proformaInvoice.lineAmount'),
      minWidth: 240
    },
    {
      field: 'taxCode',
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
  bodyActions: []
})

async function init() {
  console.log(123, formData)

  // 頁面Data
  formModel.pi_number = formData.pi_number
  formModel.status = formData.status
  formModel.invoice_date = formData.invoice_date
  formModel.scheduleDate = formData.scheduleDate
  formModel.customerNumber = formData.customerNumber
  formModel.customerName = formData.customerName
  formModel.office = formData.office
  formModel.invoice_header = formData.invoice_header
  formModel.currencyCode = formData.currencyCode
  formModel.sub_total = formData.sub_total
  formModel.total_tax = formData.total_tax
  formModel.total_amount = formData.total_amount
  formModel.warehouse_location = formData.warehouse_location
  formModel.subinventory = formData.subinventory
  formModel.payment_in_adv = formData.payment_in_adv
  formModel.overdue_debt = formData.overdue_debt
  formModel.pi_remarks = formData.pi_remarks
  formModel.submitted_by = formData.submitted_by
  formModel.submitted_date = formData.submitted_date
  formModel.lines = formData.lines

  // 提交需要的Data
  formModel.customerId = formData.customerId
  formModel.companyTitle = formData.companyTitle
  formModel.organizationId = formData.organizationId
  formModel.initialPickupLocationId = formData.initialPickupLocationId

  reload()
}

watch(
  () => formData.lines,
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
  userName: string
}>({
  org_id: 0,
  office: '',
  operatingName: '',
  userId: '',
  userName: ''
})

function getUserInfo() {
  const user = useUserState()
  userInfo.value.userName = `${user.value.lastName} ${user.value.firstName}`

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
  if (buttonName === 'accountant_approval') {
    const { value } = await ElMessageBox.prompt(t('quotationApproval.reject_comment'), {
      confirmButtonText: t('common_submit')
    })
    return {
      approver: userInfo.value.userName,
      approval_date: dayjs().format('YYYY-MM-DD'),
      reject_reason: value
    }
  }

  const result = {}
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
            <el-input v-model="formModel.customerNumber" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.currency')">
            <el-input v-model="formModel.currencyCode" disabled />
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
            <el-input v-model="formModel.customerName" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.subTotal')">
            <el-input v-model="formModel.sub_total" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.subInventory')">
            <el-input v-model="formModel.subinventory" disabled />
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
            <el-date-picker v-model="formModel.scheduleDate" type="date" format="YYYY/MM/DD" value-format="x" disabled />
          </el-form-item>
          <el-form-item :label="t('proformaInvoice.invoiceHeader')">
            <el-select v-model="formModel.invoice_header" disabled>
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
            <el-input v-model="formModel.pi_remarks" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.submittedBy')">
            <el-input v-model="formModel.submitted_by" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.submittedDate')">
            <el-date-picker v-model="formModel.submitted_date" type="date" format="YYYY/MMM/DD" value-format="YYYY-MM-DD" disabled />
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
