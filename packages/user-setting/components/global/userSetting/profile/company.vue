<script setup lang="ts">
import { clientApi } from 'api'

const modelValue = defineModel<any>({ default: '' })

defineProps<{
  item?: any
}>()

const officesOptions = ref<any[]>([])
async function getOffices() {
  try {
    officesOptions.value = await clientApi.instance.get(`/apis/v1/ms/oracle/order-info/offices`).then((r) => r.data.items)
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  getOffices()
})
</script>

<template>
  <el-select v-model="modelValue" :disabled="item?.readyOnly">
    <el-option v-for="i in officesOptions" :key="i.org_name" :label="i.org_name" :value="i.org_name" />
  </el-select>
</template>

<style scoped lang="scss"></style>
