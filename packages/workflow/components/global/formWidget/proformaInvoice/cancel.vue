<script setup lang="ts">
import { useUserState } from '@packages/authApp/composables/useAuth'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()
const formRef = ref()
const selectData = reactive({
  length: 0
})
const rules = ref({
  length: [
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) < 1) {
          callback(new Error(''))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
})
const selectedRowsList = ref<any[]>([])
watch(
  () => selectedRowsList.value.length,
  (len) => {
    selectData.length = len ?? 0
  },
  { immediate: true }
)

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
  approval_date: number
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
  approval_date: 0,
  items: []
})
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'proformaInvoiceCancel',
  api: () => {
    return formModel.items
  },
  columns: [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      field: 'index',
      title: t('proformaInvoice.index'),
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'imported',
      title: t('proformaInvoice.imported'),
      minWidth: 60
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
  bodyActions: [],
  selectChangeHander: (selectedRows: any[]) => {
    selectedRowsList.value = selectedRows
  }
})

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

async function grtPiInfo(piNumber: string) {
  const data = await clientApi.instance.get(`/apis/v1/ms/wfl/proforma-invoices/${piNumber}`).then((r) => r.data)
  console.log(123, data)
  formModel.items = []
  await reload()
}

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

watch(
  () => formData.pi_number,
  (value) => {
    // grtPiInfo(value)
  },
  { deep: true }
)

async function getFormData(needValidation = true) {
  if (!needValidation) return { ...formModel }

  if (selectedRowsList.value.length === 0) {
    ElMessage.error(t('proformaInvoice.selectAtLeastOneRow'))
    throw new Error('')
  }

  await formRef.value?.validate()

  return {
    lineNos: selectedRowsList.value.map((item) => {
      return item.line_number
    })
  }
}

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" :model="formModel" label-position="top" class="all-input-style">
    <div class="info-item-card">
      <el-row>
        <el-col :span="6">
          <el-form-item :label="t('proformaInvoice.piNumber')">
            <el-input v-model="formModel.pi_number" @change="grtPiInfo" />
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
      </el-row>
    </div>
  </el-form>

  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="toolbar-selected">
          <div class="toolbar-selected__title">
            <span class="toolbar-selected__label">{{ t('proformaInvoice.lineItems') }}</span>
            <span class="toolbar-selected__hint">{{ t('proformaInvoice.cancelHint') }}</span>
          </div>

          <el-form ref="formRef" :model="selectData" :rules="rules" label-position="left" inline class="toolbar-selected__form">
            <el-form-item :label="t('transferNoteApproval.quantity')" prop="length">
              <el-input v-model="selectData.length" disabled />
            </el-form-item>
          </el-form>
        </div>
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

  :deep(.vxe-toolbar) {
    padding-right: 0;
  }

  :deep(.vxe-buttons--wrapper) {
    width: 100%;
  }

  :deep(.vxe-tools--wrapper),
  :deep(.vxe-tools--operate) {
    display: none;
  }
}

.all-input-style {
  :deep(.el-select),
  :deep(.el-input) {
    width: 98%;
  }
}

.toolbar-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;

  &__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    min-width: 0;
  }

  &__label {
    font-size: 20px;
    color: #2354b8;
    white-space: nowrap;
  }

  &__hint {
    font-size: 20px;
    color: #ca322d;
  }

  &__form {
    margin-bottom: 0;
    flex-shrink: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 0;
    }
  }
}
</style>
