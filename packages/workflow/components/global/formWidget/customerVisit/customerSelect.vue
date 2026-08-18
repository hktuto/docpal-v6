<script setup lang="ts">
const { formData } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()

const customerDetail = ref({
  customer_number: '',
  customer_name: '',
  customer_engineer_name: '',
  customer_location: ''
})
const searchData = ref({
  customerName: '',
  customerEngineerName: ''
})

const parties = ref<any[]>([])
const customerNumberOptions = ref<{ label: string; value: string }[]>([])
const customerNameOptions = ref<{ label: string; value: string }[]>([])
const customerEngineerNameOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)

async function searchName(query?: string) {
  if (query !== '') {
    const data: any[] = await $api.get(`/apis/v1/ms/oracle/customers?query=${query}&limit=${100}`).then((r) => r.data?.items)

    const numberOptions = []
    const nameOptions = []
    const englishNameOptions = []
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
    customerEngineerNameOptions.value = englishNameOptions
  }
}

function getFormData() {
  return customerDetail.value
}

function numberChange(value: string) {
  if (!value || value === '') {
    searchData.value.customerName = ''
    searchData.value.customerEngineerName = ''
  } else if (!!value) {
    searchData.value.customerName = value
    searchData.value.customerEngineerName = value

    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      customerDetail.value.customer_name = find.customer_name
      customerDetail.value.customer_engineer_name = find.customer_eng_name

      // customerLocationRef.setValue(find.cust_location)
      // customerBackgroundRef.setValue(find.cust_describe)
    } else {
      // customerLocationRef.setValue('')
      // customerBackgroundRef.setValue('')
    }
  } else if (value === '') {
    // customerLocationRef.setValue('')
    // customerBackgroundRef.setValue('')
  }
}

function nameChange(value: string) {
  if (!value) {
    customerDetail.value.customer_name = ''
  } else {
    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      customerDetail.value.customer_number = value
      searchData.value.customerEngineerName = value
    } else {
      customerDetail.value.customer_number = ''
      customerDetail.value.customer_name = value
    }
  }
}

function enNameChange(value: string) {
  if (!value) {
    customerDetail.value.customer_engineer_name = ''
  } else {
    const find = parties.value.find((item) => item.account_number === value)
    if (!!find) {
      customerDetail.value.customer_number = value
      searchData.value.customerName = value
    } else {
      customerDetail.value.customer_number = ''
      customerDetail.value.customer_engineer_name = value
    }
  }
}

onMounted(() => {
  searchName()
})

defineExpose({ getFormData })
</script>

<template>
  <el-form label-position="top" class="all-input-style">
    <el-row>
      <el-col :span="6">
        <el-form-item label="客户编号">
          <el-select-v2
            v-model="customerDetail.customer_number"
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
      </el-col>
      <el-col :span="6">
        <el-form-item label="客户中文名">
          <el-select-v2
            v-model="searchData.customerName"
            allow-create
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
      </el-col>
      <el-col :span="6">
        <el-form-item label="客户英文名">
          <el-select-v2
            v-model="searchData.customerEngineerName"
            allow-create
            :reserve-keyword="false"
            filterable
            remote
            :remote-method="searchName"
            remote-show-suffix
            clearable
            :options="customerEngineerNameOptions"
            :loading="loading"
            placeholder="Please enter a keyword"
            @change="enNameChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="客戶地址">
          <el-input v-model="customerDetail.customer_location" />
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
