<script setup lang="ts">
import { useWHPOListInject } from '../../composables/useWHPOList'
import { useWHPOListTableInject } from '../../composables/useWHPOListTable'
import { detectPoIssues } from '../../utils/custPo'

const detecting = ref(false)
const issues = ref<any[]>([])
const { selectedPo, syncPoTotals } = useWHPOListInject()
const { tableData, saveTableData, clearMatchingRowHighlight } = useWHPOListTableInject()

async function handleDetect(isInit = true) {
  if (detecting.value) return
  detecting.value = true
  try {
    if (!isInit) {
      await saveTableData()
      syncPoTotals(tableData.value)
    }
    issues.value = await detectPoIssues(selectedPo.value)
    clearMatchingRowHighlight()
  } catch (error) {
    console.error(error)
  } finally {
    detecting.value = false
  }
}

watch(
  selectedPo,
  (po) => {
    issues.value = []
    if (po) handleDetect()
  },
  { immediate: true }
)

defineExpose({ handleDetect })
</script>

<template>
  <WHDetectedCard :issues="issues" :detecting="detecting" @detect="handleDetect(false)" />
</template>
