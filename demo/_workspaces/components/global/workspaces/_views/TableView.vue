<script setup lang="ts">
import type { CaseViewRecord } from '../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  view: CaseViewRecord
  tableView: ReturnType<typeof useTableView>
}>()

const emit = defineEmits<{
  saveView: []
}>()

function handleSaveView() {
  emit('saveView')
}
</script>

<template>
  <div class="table-view-container">
    <MdTable 
      v-if="view" 
      :editable="true" 
      @saveView="handleSaveView" 
    />
  </div>
</template>

<style lang="scss" scoped>
.table-view-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
