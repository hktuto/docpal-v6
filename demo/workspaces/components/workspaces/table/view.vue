<template>
  <div style="height: 100%">
    <MdTable v-if="tableId" :table-id="tableId" :extra-column-config="extraColumnConfig" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  dataTableId: string
}>()
const tableId = computed(() => props.dataTableId)
const { currentView, tableFields, deleteField, updateField, addField, updatedViewConfigs, saveColumnOrder } = useTableViewsInject()
const columns = computed(() => currentView.value?.displayColumns)

const extraColumnConfig = computed(() => {
  const data = {
    columns,
    deleteColumn: deleteField,
    updateColumn: updateField,
    addColumn: addField,
    tableFields,
    updatedViewConfigs,
    saveColumnOrder
  }
  return data
})
</script>

<style lang="scss" scoped></style>
