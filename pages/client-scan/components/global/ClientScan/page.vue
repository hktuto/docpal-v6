<script lang="ts" setup>
// Props passed from menu router
const props = defineProps<{
  id?: string
}>()
const stateEl = ref()
function tableUpdated() {
  stateEl.value.getStats()
}
// Example: Update props when needed
// function handleIdChange(newId: string) {
//   routerProvider?.updateProps({ id: newId })
// }
</script>

<template>
  <div class="page-container">
    <div class="page-title">
      <div class="title">Batch List</div>
      <ScanNewBatch />
    </div>
    <ScanListStat ref="stateEl" />
    <ScanListTable @updated="tableUpdated" />
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-s);
  justify-content: flex-start;
}
.page-title {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
}
.title {
  flex: 1 0 auto;
  font-size: 2rem;
  font-weight: bold;
}
</style>
