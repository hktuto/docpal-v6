<template>
  <div class="caseStatsTable">
    <CaseStatisticsTable ref="tableRef" mode="mock" :setting="state" :displayColumns="state.displayColumns" />
  </div>
</template>
<script lang="ts" setup>
const state = reactive({
  displayColumns: []
})
const tableRef = ref()
function initColumns(data: any) {
  state.displayColumns = data
}

defineExpose({ initColumns })
</script>
<style lang="scss">
.caseStatsTable {
  height: 100%;
  overflow: hidden;
}
</style>
