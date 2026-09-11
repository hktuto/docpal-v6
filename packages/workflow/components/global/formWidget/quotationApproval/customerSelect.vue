<script setup lang="ts">
import { clientApi } from 'api'

const { disabled, formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const { t } = useI18n()

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
  customer_number: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerNumber') }), trigger: 'change' }],
  customerName: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerName') }), trigger: 'change' }],
  customerEnglishName: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerEngName') }), trigger: 'change' }],
  customer_contact: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerContact') }), trigger: 'blur' }],
  telephone_number: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.telephoneNumber') }), trigger: 'blur' }],
  customer_email: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerEmail') }), trigger: 'blur' },
    { type: 'email', message: t('user_emailFormatError'), trigger: 'blur' }
  ],
  customer_background: [{ required: true, message: t('render.hint.fieldRequired', { name: t('quotationApproval.customerBackground') }), trigger: 'change' }]
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
  const data: any[] = await clientApi.instance.get(`/apis/v1/ms/oracle/customers?q=${query}&limit=${5000}`).then((r: any) => r.data?.items)

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
  const info = await clientApi.instance.get(`apis/v1/ms/oracle/customers/${customerNumber}`).then((r: any) => r.data)

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
        <el-form-item :label="t('quotationApproval.checkCustomer')" prop="check_customer">
          <el-select v-model="formModel.check_customer" :placeholder="t('quotationApproval.selectOptionRequired')" disabled>
            <el-option :label="t('quotationApproval.newCustomer')" value="New Customer" />
            <el-option :label="t('quotationApproval.existingCustomer')" value="Existing Customer" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerNumber')" prop="customer_number">
          <el-select-v2
            v-model="formModel.customer_number"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            :loading="loading"
            :placeholder="t('quotationApproval.selectOptionRequired')"
            @change="numberChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerName')" prop="customerName">
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
            :placeholder="t('quotationApproval.selectOptionRequired')"
            @change="nameChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerEngName')" prop="customerEnglishName">
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
            :placeholder="t('quotationApproval.selectOptionRequired')"
            @change="enNameChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerContact')" prop="customer_contact">
          <el-input v-model="formModel.customer_contact" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.telephoneNumber')" prop="telephone_number">
          <el-input v-model="formModel.telephone_number" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerEmail')" prop="customer_email">
          <el-input v-model="formModel.customer_email" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerLocation')">
          <el-input v-model="formModel.customer_location" disabled />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerBackground')" prop="customer_background">
          <el-select v-model="formModel.customer_background" :placeholder="t('quotationApproval.selectOptionRequired')">
            <el-option value="OEM">OEM</el-option>
            <el-option value="ODM">ODM</el-option>
            <el-option value="Trading">Trading</el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.customerWebsite')">
          <el-input v-model="formModel.customer_website" />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item :label="t('quotationApproval.endUser')" prop="end_user" :required="formModel.customer_background === 'OEM'">
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
