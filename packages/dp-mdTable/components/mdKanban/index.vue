<script lang="ts" setup>
import  { useMDKanban, type MDKanbanProps } from '../../composables/mdKanban/useMDKanban'

const props = withDefaults(defineProps<MDKanbanProps>(), {
  tableId: '',
  editable: false,
  extraColumnConfig: () => ({
    columns: [],
    deleteColumn: () => {},
    updateColumn: () => {},
    addColumn: () => {},
    tableFields: [],
    updatedViewColumnsConfig: () => {},
    saveColumnOrder: () => {},
    columnFilterRules: [],
    columnGroupRules: [],
    columnSortRules: []
  })
})

const emit = defineEmits<{
  refresh: []
  search: [value: string]
  'add-row': []
}>()
const { columns, cardRef, getTableData, addRow, systemFieldsTypes } = useMDKanban(props)

async function handleRefresh() {
  await getTableData({ pageNum: 1 })
  emit('refresh')
}

function handleSearch(value: string) {
  emit('search', value)
}

const MdFormPopoverRef = ref()
function handleAddRow() {
  MdFormPopoverRef.value.open({})
}
async function handleAddRowSubmit(data: any) {
  console.log('handleAddRowSubmit', data)
  await addRow(data)
  handleRefresh()
}

</script>


<template>
<div class="kanbanViewContainer">
{{extraColumnConfig.viewStyleConfig}}
mdkanban
</div>
</template>
