<script setup lang="ts">
import { clientApi } from 'api'

const modelValue = defineModel<any>({ default: '' })

defineProps<{
  item?: any
}>()

const branchOfficesOptions = ref<any[]>([])
async function getBranchOffices() {
  try {
    branchOfficesOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/branch-offices`).then((r) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  getBranchOffices()
})
</script>

<template>
  <el-select v-model="modelValue" :disabled="item?.readyOnly" filterable>
    <el-option v-for="i in branchOfficesOptions" :key="i.branch_office" :label="i.branch_office" :value="i.branch_office" />
  </el-select>
</template>

<style scoped lang="scss"></style>
