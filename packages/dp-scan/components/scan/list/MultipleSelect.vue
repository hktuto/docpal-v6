<script lang="ts" setup>
const props = defineProps<{
  selectedRow: any[]
}>()

const emit = defineEmits(['cancel', 'batchCancel', 'batchExport'])

const canCancel = computed(() => {
  return props.selectedRow.every((row: any) => {
    const gorupStatus = statusToGroupStatus(row.status)
    return !gorupStatus || (gorupStatus.key !== 'cancelled' && gorupStatus.key !== 'completed')
  })
})

const canDownload = computed(() => {
  return props.selectedRow.every((row: any) => {
    const gorupStatus = statusToGroupStatus(row.status)
    return gorupStatus && (gorupStatus.key === 'completed' || gorupStatus.key === 'exportReady')
  })
})
</script>

<template>
  <div class="multiple-selected">
    <div class="left">
      <span>Selected ({{ selectedRow.length }})</span>
      <el-button type="text" @click="$emit('cancel')">Clear</el-button>
    </div>
    <div class="right">
      <el-button :type="canCancel ? 'error' : 'info'" :disabled="!canCancel" @click="$emit('batchCancel')">Batch Cancel</el-button>
      <el-button :type="canDownload ? 'primary' : 'info'" :disabled="!canDownload" @click="$emit('batchExport')">Batch Export</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multiple-selected {
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: var(--app-info-alpha-30);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
.left {
  flex: 1 0 auto;
}
</style>
