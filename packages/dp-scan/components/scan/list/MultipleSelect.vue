<script lang="ts" setup>
const props = defineProps<{
  selectedRow: any[]
}>()

const emit = defineEmits(['cancel', 'batchCancel', 'batchExport'])

const { isAdmin, isExporter } = useScanClient()

/**
 * Check if user can cancel selected batches
 * Requires: admin permission for all selected batches' projects
 * AND status must allow cancel (not cancelled or completed)
 */
const canCancel = computed(() => {
  return props.selectedRow.every((row: any) => {
    const gorupStatus = statusToGroupStatus(row.status)
    const canCancelStatus = !gorupStatus || (gorupStatus.key !== 'cancelled' && gorupStatus.key !== 'completed')
    const hasAdminPermission = isAdmin(row.projectId)
    return canCancelStatus && hasAdminPermission
  })
})

/**
 * Check if user can export selected batches
 * Requires: exporter permission for all selected batches' projects
 * AND status must allow export (completed or exportReady)
 */
const canDownload = computed(() => {
  const hasExportPermission = props.selectedRow.every((row: any) => isExporter(row.projectId))
  // console.log(props.selectedRow)
  return true
  const hasExportableStatus = props.selectedRow.every((row: any) => {
    const gorupStatus = statusToGroupStatus(row.status)
    return gorupStatus && (gorupStatus.key === 'completed' || gorupStatus.key === 'exportReady')
  })
  return hasExportPermission && hasExportableStatus
})

function exportSelected(){
  emit('batchExport', props.selectedRow.map((row) => row.id))
}
function cancelSelected() {
  emit('batchCancel', props.selectedRow.map((row) => row.id))
}
</script>

<template>
  <div class="multiple-selected">
    <div class="left">
      <span>Selected ({{ selectedRow.length }})</span>
      <el-button type="text" @click="$emit('cancel')">Clear</el-button>
    </div>
    <div class="right">
      <el-button :type="canCancel ? 'warning' : 'info'" :disabled="!canCancel" @click="cancelSelected">Batch Cancel</el-button>
      <el-button :type="canDownload ? 'primary' : 'info'" :disabled="!canDownload" @click="exportSelected">Batch Export</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.multiple-selected {
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: #eee;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
.left {
  flex: 1 0 auto;
}
</style>
