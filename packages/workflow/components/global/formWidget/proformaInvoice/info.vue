<script setup lang="ts">
import { ElMessage } from 'element-plus'

const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const searchFormRef = ref()
const formWidgetProformaInvoicePreloadTable = ref()
const temporary_list = ref<any[]>([])
const formModel = reactive({
  selectedRowsListLength: 0
})
const searchFormModel = reactive({
  office: '',
  branch_office: '',
  brand: '',
  part_number: '',
  so_number: '',
  customer_number: '',
  customerName: '',
  customerEnglishName: ''
})
const rules = {
  selectedRowsListLength: [
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
}
const searchRules = {
  office: [{ required: true, message: '請選擇辦事處', trigger: 'change' }],
  branch_office: [{ required: true, message: '請選擇辦公室', trigger: 'change' }]
}

type SelectOption = { label: string; value: string }
const officeOptions = ref<any[]>([])
const branchOfficeOptions = ref<any[]>([])
const brandOptions = ref<any[]>([])
const partNumberOptions = ref<SelectOption[]>([])
const soNumberOptions = ref<SelectOption[]>([])
const customerNumberOptions = ref<SelectOption[]>([])
const customerNameOptions = ref<SelectOption[]>([])
const customerEnglishNameOptions = ref<SelectOption[]>([])
const parties = ref<any[]>([])
const loading = ref(false)

const selectedRowsListLength = computed(() => {
  return formWidgetProformaInvoicePreloadTable.value?.selectedRowsList?.length || 0
})
watch(
  selectedRowsListLength,
  (len) => {
    formModel.selectedRowsListLength = len
  },
  { immediate: true }
)

function resetCustomerFields() {
  searchFormModel.customer_number = ''
  searchFormModel.customerEnglishName = ''
}

function applyCustomer(value: string) {
  const find = parties.value.find((item) => item.account_number === value)
  if (!find) return
  searchFormModel.customer_number = value
}

async function searchCustomer(query?: string) {
  const data: any[] = await $api.get(`/apis/v1/ms/oracle/customers?q=${query || ''}&limit=${5000}`).then((r: any) => r.data?.items)
  if (!data?.length) return

  parties.value = data
  customerNumberOptions.value = data.map((item) => ({ label: item.account_number, value: item.account_number }))
  customerNameOptions.value = data.map((item) => ({ label: item.customer_name, value: item.account_number }))
  customerEnglishNameOptions.value = data.map((item) => ({ label: item.customer_eng_name, value: item.account_number }))
}

function handleCustomerChange(value: string) {
  if (!value) {
    resetCustomerFields()
    return
  }
  applyCustomer(value)
}

async function getOffices() {
  officeOptions.value = await $api.get(`/apis/v1/ms/oracle/order-info/offices`).then((r: any) => r.data.items)
}

async function getBranchOffices(org_id: number) {
  if (!org_id) {
    branchOfficeOptions.value = []
    return
  }
  searchFormModel.branch_office = ''

  branchOfficeOptions.value = await $api.get(`/apis/v1/ms/oracle/order-info/branch-offices?org_id=${org_id}`).then((r: any) => r.data.items)
}

async function getBrandOptions() {
  brandOptions.value = await $api.get(`/apis/v1/ms/oracle/brands?limit=500`).then((r: any) => r.data.items)
}

async function getPartList(query?: string) {
  const brandQuery = searchFormModel.brand ? `&brand=${searchFormModel.brand}` : ''
  const data = await $api
    .get(`/apis/v1/ms/oracle/wcl-item-nos?q=${query || ''}${brandQuery}&pageNum=1&pageSize=100&includeCustomer=false`)
    .then((r: any) => r.data.items)
  if (!data?.length) return

  partNumberOptions.value = data.map((item: any) => ({
    label: item.wcl_item_no,
    value: item.wcl_item_no
  }))
}

function handleBrandChange() {
  searchFormModel.part_number = ''
  partNumberOptions.value = []
}

async function handleSearch() {
  const valid = await searchFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (!searchFormModel.customer_number && !searchFormModel.so_number) {
    ElMessage.error('請填寫客戶編號或訂單編號')
    return
  }

  temporary_list.value = [
    {
      order_number: 'SO-2026-0001',
      customer_number: 'CUST-0122',
      customer_name: '普瑞斯電路板製造',
      customer_english_name: 'Precise PCB Manufacturing Co.Ltd.',
      part_number: 'KOA/RS73F1JTTD 3002B',
      order_quantity: 100,
      balance_quantity: 80,
      description: 'CHIP.RES 0603 30K OHM 0.1% 1/5W Sn MPQ=5K/R MOQ=5000',
      sub_inventory: 'FG',
      tax_code: 'VAT0',
      currency: 'HKD',
      amount: 1250.0,
      bill_to_location: 'Hong Kong Island',
      ship_to_location: 'Kowloon Bay Warehouse'
    }
  ]
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleClear() {
  temporary_list.value = []
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleRemoveUnSelectedLines(selectedRows: any[]) {
  temporary_list.value = selectedRows
  formWidgetProformaInvoicePreloadTable.value.reload()
}

function handleDelete(row: any) {
  temporary_list.value = temporary_list.value.filter((item: any) => item.order_number !== row.order_number)
  formWidgetProformaInvoicePreloadTable.value.reload()
}

onMounted(() => {
  getOffices()
  getBrandOptions()
})

async function getFormData(needValidation = true) {
  if (!needValidation) return {}
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.error('請選擇訂單')
    throw new Error('')
  }

  const selectedRowsList = formWidgetProformaInvoicePreloadTable.value?.selectedRowsList
  const list = deepCopy(selectedRowsList).map((item: any) => {
    delete item['_X_ROW_KEY']
    return item
  })

  return { order_item_list: list }
}

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="searchFormRef" label-position="top" class="all-input-style" :model="searchFormModel" :rules="searchRules">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="辦事處 Office" prop="office" required>
          <el-select v-model="searchFormModel.office" filterable clearable placeholder="One of the options must be selected." @change="getBranchOffices">
            <el-option v-for="item in officeOptions" :key="item.org_id" :label="item.organization_code" :value="item.org_id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="辦公室 Branch Office" prop="branch_office" required>
          <el-select v-model="searchFormModel.branch_office" filterable clearable placeholder="One of the options must be selected.">
            <el-option v-for="item in branchOfficeOptions" :key="item.value" :label="item.branch_office" :value="item.branch_office" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="品牌 Brand" prop="brand">
          <el-select v-model="searchFormModel.brand" filterable clearable placeholder="Select an option" @change="handleBrandChange">
            <el-option v-for="(item, index) in brandOptions" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="零件編號 Part Number" prop="part_number">
          <el-select-v2
            v-model="searchFormModel.part_number"
            filterable
            remote
            :remote-method="getPartList"
            remote-show-suffix
            clearable
            :options="partNumberOptions"
            :loading="loading"
            placeholder="Select an option"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="銷售訂單編號 So Number" prop="so_number">
          <el-select-v2 v-model="searchFormModel.so_number" filterable allow-create clearable :options="soNumberOptions" placeholder="Select an option" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶編號 Customer Number" prop="customer_number">
          <el-select-v2
            v-model="searchFormModel.customer_number"
            filterable
            remote
            :remote-method="searchCustomer"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            :loading="loading"
            placeholder="Select an option"
            @change="handleCustomerChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶名稱 Customer Name" prop="customerName">
          <el-select-v2
            v-model="searchFormModel.customerName"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchCustomer"
            remote-show-suffix
            clearable
            :options="customerNameOptions"
            :loading="loading"
            placeholder="Select an option"
            @change="handleCustomerChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶英文名稱 Customer Engineer Name" prop="customerEnglishName">
          <el-select-v2
            v-model="searchFormModel.customerEnglishName"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchCustomer"
            remote-show-suffix
            clearable
            :options="customerEnglishNameOptions"
            :loading="loading"
            placeholder="Select an option"
            @change="handleCustomerChange"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <el-button type="primary" style="width: 100%; margin-block-end: 20px" @click="handleSearch">搜索 Search</el-button>
  <el-divider content-position="left">暫存表 Temporary Table</el-divider>

  <FormWidgetProformaInvoicePreloadTable
    ref="formWidgetProformaInvoicePreloadTable"
    :disabled="false"
    :temporary_list="temporary_list"
    @clear="handleClear"
    @removeUnSelectedLines="handleRemoveUnSelectedLines"
    @delete="handleDelete"
  >
    <template #length>
      <el-form ref="formRef" :model="formModel" :rules="rules" label-position="left" inline>
        <el-form-item label="已選中數量 Selected Quantity" prop="selectedRowsListLength">
          <el-input v-model="formModel.selectedRowsListLength" disabled />
        </el-form-item>
      </el-form>
    </template>
  </FormWidgetProformaInvoicePreloadTable>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-select) {
    width: 100%;
  }
  ::v-deep(.el-input) {
    width: 100%;
  }
}
</style>
