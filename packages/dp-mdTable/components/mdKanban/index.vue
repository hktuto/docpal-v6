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

// open setting logic
const kanbanSettingRef = ref()
function openSetting() {
  kanbanSettingRef.value.open()
}

watch(() => props.extraColumnConfig.viewStyleConfig, () => {
  if (!props?.extraColumnConfig?.viewStyleConfig?.selectedColumnId) {
    nextTick(() => {
      openSetting()
    })
  }
}, {
  deep: true,
  immediate: true
})



</script>


<template>
<div class="kanbanViewContainer">
{{extraColumnConfig.viewStyleConfig}}
mdkanban
<MdKanbanSettingDialog ref="kanbanSettingRef"  />
</div>
</template>
