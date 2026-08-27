<script setup lang="ts">
const { disabled, formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const defaultFormModel = () => ({
  check_customer: 'New Customer',
  customer_number: '',
  customer_name: '',
  customer_eng_name: '',
  customer_location: '',
  customer_website: '',
  customer_email: '',
  telephone_number: '',
  customer_contact: '',
  customer_background: 'OEM',
  end_user: '',
  customerName: '',
  customerEnglishName: ''
})
const formModel = reactive(defaultFormModel())

const rules = {
  customer_number: [{ required: true, message: '請選擇客戶編號', trigger: 'change' }],
  customerName: [{ required: true, message: '請選擇客戶名稱', trigger: 'change' }],
  customerEnglishName: [{ required: true, message: '請選擇客戶英文名', trigger: 'change' }],
  customer_contact: [{ required: true, message: '請輸入客戶聯絡人', trigger: 'blur' }],
  telephone_number: [{ required: true, message: '請輸入客戶聯絡方式', trigger: 'blur' }],
  customer_email: [
    { required: true, message: '請輸入客戶郵箱', trigger: 'blur' },
    { type: 'email', message: '請輸入正確的郵箱格式', trigger: 'blur' }
  ],
  customer_background: [{ required: true, message: '請選擇客戶背景', trigger: 'change' }]
}

const parties = ref<any[]>([])
const customerNumberOptions = ref<{ label: string; value: string }[]>([])
const customerNameOptions = ref<{ label: string; value: string }[]>([])
const customerEnglishNameOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)

function resetFormModel() {
  const checkCustomer = formModel.check_customer
  Object.assign(formModel, defaultFormModel())
  formModel.check_customer = checkCustomer
}

async function searchName(query?: string) {
  const data: any[] = await $api.get(`/apis/v1/ms/oracle/customers?q=${query}&limit=${5000}`).then((r: any) => r.data?.items)

  if (data.length === 0) return

  const numberOptions: any[] = []
  const nameOptions: any[] = []
  const englishNameOptions: any[] = []
  parties.value = data

  data.forEach((item: any) => {
    numberOptions.push({
      label: item.account_number,
      value: item.account_number
    })
    nameOptions.push({
      label: item.customer_name,
      value: item.account_number
    })
    englishNameOptions.push({
      label: item.customer_eng_name,
      value: item.account_number
    })
  })

  customerNumberOptions.value = numberOptions
  customerNameOptions.value = nameOptions
  customerEnglishNameOptions.value = englishNameOptions
}

async function getCustomerInfo(customerNumber: string) {
  if (!customerNumber || customerNumber === '') return
  const info = await $api.get(`apis/v1/ms/oracle/customers/${customerNumber}`).then((r: any) => r.data)

  formModel.customer_location = info.customer_location ?? ''
  formModel.telephone_number = info.customer_telephone_number ?? ''
  formModel.customer_contact = info.customer_contact ?? ''
  formModel.customer_email = info.customer_email ?? ''
  formModel.customer_website = ''
}

function applyParty(value: string, find: any) {
  formModel.customer_number = value
  formModel.customerName = value
  formModel.customerEnglishName = value
  formModel.customer_name = find.customer_name
  formModel.customer_eng_name = find.customer_eng_name
}

async function numberChange(value: string) {
  if (!value || value === '') {
    resetFormModel()
    return
  }
  const find = parties.value.find((item) => item.account_number === value)
  if (find) {
    applyParty(value, find)
    await getCustomerInfo(value)
  } else {
    formModel.customer_name = ''
    formModel.customer_eng_name = ''
    formModel.customerName = ''
    formModel.customerEnglishName = ''
    formModel.customer_location = ''
  }
}

async function nameChange(value: string) {
  if (!value || value === '') {
    resetFormModel()
    return
  }
  const find = parties.value.find((item) => item.account_number === value)
  if (find) {
    applyParty(value, find)
    await getCustomerInfo(value)
  } else {
    formModel.customer_number = ''
    formModel.customer_name = value
    formModel.customer_eng_name = ''
    formModel.customerEnglishName = ''
    formModel.customer_location = ''
  }
}

async function enNameChange(value: string) {
  if (!value) {
    resetFormModel()
    return
  }
  const find = parties.value.find((item) => item.account_number === value)
  if (find) {
    applyParty(value, find)
    await getCustomerInfo(value)
  } else {
    formModel.customer_number = ''
    formModel.customer_name = ''
    formModel.customer_eng_name = value
    formModel.customerName = ''
    formModel.customer_location = ''
  }
}

function init() {
  if (!formData) return

  Object.assign(formModel, {
    check_customer: formData.check_customer ?? 'New Customer',
    customer_number: formData.customer_number ?? '',
    customer_name: formData.customer_name ?? '',
    customer_eng_name: formData.customer_eng_name ?? '',
    customer_location: formData.customer_location ?? '',
    customer_website: formData.customer_website ?? '',
    customer_email: formData.customer_email ?? '',
    telephone_number: formData.telephone_number ?? '',
    customer_contact: formData.customer_contact ?? '',
    customer_background: formData.customer_background ?? 'OEM',
    end_user: formData.end_user ?? '',
    customerName: formData.customer_number ?? '',
    customerEnglishName: formData.customer_number ?? ''
  })
}

async function getFormData(needValidation = true) {
  if (needValidation) {
    await formRef.value?.validate()
  }
  const { customerName: _customerName, customerEnglishName: _customerEnglishName, ...result } = formModel
  return result
}

onMounted(() => {
  searchName()
})

watch(
  () => formData.customer_name,
  () => {
    init()
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" label-position="top" class="all-input-style" :model="formModel" :rules="rules" :disabled="disabled">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="客戶狀態 Check Customer" prop="check_customer">
          <el-select v-model="formModel.check_customer" placeholder="One of the options must be selected." disabled>
            <el-option label="New Customer" value="New Customer" />
            <el-option label="Existing Customer" value="Existing Customer" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶編號 Customer Number" prop="customer_number">
          <el-select-v2
            v-model="formModel.customer_number"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            :loading="loading"
            placeholder="One of the options must be selected."
            @change="numberChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶名稱 Customer Name" prop="customerName">
          <el-select-v2
            v-model="formModel.customerName"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNameOptions"
            :loading="loading"
            placeholder="One of the options must be selected."
            @change="nameChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶英文名 Customer Eng Name" prop="customerEnglishName">
          <el-select-v2
            v-model="formModel.customerEnglishName"
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerEnglishNameOptions"
            :loading="loading"
            placeholder="One of the options must be selected."
            @change="enNameChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶聯絡人 Customer Contact" prop="customer_contact">
          <el-input v-model="formModel.customer_contact" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶聯絡方式 Telephone Number" prop="telephone_number">
          <el-input v-model="formModel.telephone_number" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶郵箱 Customer Email" prop="customer_email">
          <el-input v-model="formModel.customer_email" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶地址 Customer Location">
          <el-input v-model="formModel.customer_location" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶背景 Customer Background" prop="customer_background">
          <el-select v-model="formModel.customer_background" placeholder="One of the options must be selected.">
            <el-option value="OEM">OEM</el-option>
            <el-option value="ODM">ODM</el-option>
            <el-option value="Trading">Trading</el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶網址 Customer Website">
          <el-input v-model="formModel.customer_website" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="終端用戶 End User" prop="end_user" :required="formModel.customer_background === 'OEM'">
          <el-input v-model="formModel.end_user" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
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
