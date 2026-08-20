<script setup lang="ts">
import { v7 as uuidv7 } from 'uuid'
const { disabled, formData, options } = defineProps<{
  disabled: boolean
  formData: any
  options: any
}>()
const foundryCustNum = ref('')
const customerOptions = ref<any[]>([])
const loading = ref(false)
const allOptions = ref<any[]>([])

async function searchName(query: string) {
  const data: any[] = await $api.get(`/apis/v1/ms/oracle/customers?q=${query}&limit=${5000}`).then((r: any) => r.data?.items)
  allOptions.value = [...allOptions.value, ...data]

  customerOptions.value = data.map((item) => ({
    label: `${item.account_number} - ${item.customer_name}`,
    value: item.account_number
  }))
}

function getFormData(needValidation = true) {
  const newMap = foundryCustNum.value.map((item) => {
    const find = allOptions.value.find((partie) => partie.account_number === item)

    return {
      id: uuidv7(),
      sample_request_id: formData.sample_request_id,
      cust_num: item,
      chinese_name: find?.customer_name || '',
      english_name: find?.customer_eng_name || '',
      create_time: Date.now()
    }
  })

  return { foundry_cust_num: foundryCustNum.value, foundry_list: newMap }
}

onMounted(() => {
  searchName('')
})

defineExpose({ getFormData })
</script>

<template>
  <el-form-item label="代工廠編號 / 名">
    <el-select-v2
      v-model="foundryCustNum"
      filterable
      remote
      multiple
      :remote-method="searchName"
      remote-show-suffix
      clearable
      :options="customerOptions"
      :loading="loading"
      placeholder="Please enter a keyword"
    />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
