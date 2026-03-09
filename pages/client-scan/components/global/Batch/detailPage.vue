<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  batchId: string
}>()
const { projectsPermissions } = useScanClient()
const loading = ref(false)
const batchDetail = ref()
async function getBatchDetail() {
  loading.value = true
  try {
    const response = await clientApi.api.getCaptureBatchBatchidDetail(props.batchId)
    console.log(response)
    batchDetail.value = response.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
watch(
  () => props.batchId,
  () => {
    getBatchDetail()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="pageContainer">
    {{ batchDetail }}
  </div>
</template>
