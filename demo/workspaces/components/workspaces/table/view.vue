<template>
  <div style="height: 100%" v-if="tableId">
    <MdCard
      v-if="currentView?.type === 'card'"
      :table-id="tableId"
      :extra-column-config="extraColumnConfig"
      :editable="true"
    />
    <MdTable v-else :table-id="tableId" :extra-column-config="extraColumnConfig" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  dataTableId: string
}>()
const tableId = computed(() => props.dataTableId)
const {
  currentView,
  tableFields,
  deleteField,
  updateField,
  addField,
  updatedViewConfigs,
  saveColumnOrder,
  columnFilterRules,
  columnSortRules,
  columnGroupRules,
  updateViewFilterSortGroup,
  viewStyleConfig
} = useTableViewsInject()
const columns = computed(() => currentView.value?.displayColumns)

const extraColumnConfig = computed(() => {
  const data = {
    columns,
    deleteColumn: deleteField,
    updateColumn: updateField,
    addColumn: addField,
    tableFields,
    updatedViewConfigs,
    saveColumnOrder,

    columnFilterRules,
    columnSortRules,
    columnGroupRules,
    updateViewFilterSortGroup,
    viewStyleConfig
  }
  return data
})
</script>

<style lang="scss" scoped></style>
