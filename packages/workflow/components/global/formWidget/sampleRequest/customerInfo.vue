<script setup lang="ts">
import { clientApi } from 'api'

const { disabled, formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const formRef = ref()
const defaultFormModel = () => ({
  cust_num: '',
  cust_name: '',
  cust_english_name: '',
  cust_location: '',
  cust_website: '',
  cust_email: '',
  cust_tel: '',
  cust_contact: '',
  cust_background: 'OEM',
  customerName: '',
  customerEnglishName: ''
})
const formModel = reactive(defaultFormModel())

const rules = {
  cust_num: [{ required: true, message: '請選擇客户编号', trigger: 'change' }],
  customerName: [{ required: true, message: '請選擇客户中文名', trigger: 'change' }],
  customerEnglishName: [{ required: true, message: '請選擇客户英文名', trigger: 'change' }]
}

const parties = ref<any[]>([])
const customerNumberOptions = ref<{ label: string; value: string }[]>([])
const customerNameOptions = ref<{ label: string; value: string }[]>([])
const customerEnglishNameOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)

function resetFormModel() {
  Object.assign(formModel, defaultFormModel())
}

async function searchName(query?: string) {
  const q = query ? `q=${query}&` : ''
  const data: any[] = await clientApi.instance.get(`/apis/v1/ms/oracle/customers?${q}&limit=${5000}`).then((r: any) => r.data?.items)

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

  formModel.cust_location = info.customer_location ?? ''
  formModel.cust_tel = info.customer_telephone_number ?? ''
  formModel.cust_contact = info.customer_contact ?? ''
  formModel.cust_email = info.customer_email ?? ''
  formModel.cust_website = ''
}

async function numberChange(value: string) {
  if (!value || value === '') {
    resetFormModel()
  } else {
    formModel.customerName = value
    formModel.customerEnglishName = value

    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      formModel.cust_name = find.customer_name
      formModel.cust_english_name = find.customer_eng_name
      await getCustomerInfo(value)
    } else {
      formModel.cust_location = ''
    }
  }
}

async function nameChange(value: string) {
  if (!value || value === '') {
    resetFormModel()
  } else {
    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      formModel.cust_num = value
      formModel.cust_name = find.customer_name
      formModel.cust_english_name = find.customer_eng_name
      formModel.customerEnglishName = value
      await getCustomerInfo(value)
    } else {
      formModel.cust_num = ''
      formModel.cust_name = value
    }
  }
}

async function enNameChange(value: string) {
  if (!value) {
    resetFormModel()
  } else {
    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      formModel.cust_num = value
      formModel.cust_name = find.customer_name
      formModel.cust_english_name = find.customer_eng_name
      formModel.customerName = value
      await getCustomerInfo(value)
    } else {
      formModel.cust_num = ''
      formModel.cust_english_name = value
    }
  }
}

function init() {
  if (!formData) return

  Object.assign(formModel, {
    cust_num: formData.cust_num ?? '',
    cust_name: formData.cust_name ?? '',
    cust_english_name: formData.cust_english_name ?? '',
    cust_location: formData.cust_location ?? '',
    cust_website: formData.cust_website ?? '',
    cust_email: formData.cust_email ?? '',
    cust_tel: formData.cust_tel ?? '',
    cust_contact: formData.cust_contact ?? '',
    cust_background: formData.cust_background ?? 'OEM',
    customerName: formData.cust_num ?? '',
    customerEnglishName: formData.cust_num ?? ''
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
  () => formData.cust_name,
  () => {
    init()
  },
  { immediate: true, deep: true }
)

defineExpose({ getFormData })
</script>

<template>
  <el-form ref="formRef" label-position="top" class="all-input-style" :model="formModel" :rules="rules" :disabled="disabled">
    <el-row>
      <el-col :span="8">
        <el-form-item label="客户编号" prop="cust_num" required>
          <el-select-v2
            v-model="formModel.cust_num"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerNumberOptions"
            :loading="loading"
            placeholder="Please enter a keyword"
            @change="numberChange"
          />
        </el-form-item>
        <el-form-item label="客戶地址">
          <el-input v-model="formModel.cust_location" />
        </el-form-item>
        <el-form-item label="客戶電話">
          <el-input v-model="formModel.cust_tel" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="客户中文名" prop="customerName" required>
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
            placeholder="Please enter a keyword"
            @change="nameChange"
          />
        </el-form-item>
        <el-form-item label="客户网址">
          <el-input v-model="formModel.cust_website" />
        </el-form-item>
        <el-form-item label="客户郵箱">
          <el-input v-model="formModel.cust_email" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="客户英文名" prop="customerEnglishName" required>
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
            placeholder="Please enter a keyword"
            @change="enNameChange"
          />
        </el-form-item>
        <el-form-item label="客户联系人">
          <el-input v-model="formModel.cust_contact" />
        </el-form-item>
        <el-form-item label="客户背景">
          <el-select v-model="formModel.cust_background">
            <el-option value="OEM">OEM</el-option>
            <el-option value="ODM">ODM</el-option>
            <el-option value="Trading">Trading</el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-select) {
    width: 95%;
  }
  ::v-deep(.el-input) {
    width: 95%;
  }
}
</style>
