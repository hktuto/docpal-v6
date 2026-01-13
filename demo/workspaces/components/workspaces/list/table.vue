<script lang="ts" setup>
import type { CaseTypeRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  items: CaseTypeRecord[]
  keyword?: string
}>()
const {items} = toRefs(props)

const { highlightText } = useTextHighlight()
const emits = defineEmits(['selected'])
const { tableRef, tableConfig, tableEvent, reload } = useVxeTable({
  id: 'workspaces-table',
  columns: [
    { field: 'icon', title: '', slots: { default: 'icon' }, width: 50 },
    { field: 'name', title: 'Name',
      type:'html',
      formatter: ({row}) => {
        return highlightText(row.name, props.keyword || '')
      }, },
    { field: 'description', title: 'Description', 
      type:'html',
      formatter: ({row}) => {
        return highlightText(row.description, props.keyword || '')
      },
    },
    { field: 'createdAt', title: 'Created Date', formatter: ({cellValue}) => {
      return formatDate(cellValue)
    } },
    { field: 'updatedAt', title: 'Updated Date', formatter: ({cellValue}) => {
      return formatDate(cellValue)
    } },
  ],
  virtualScroll:true,
  dblClickAction: ({ row, column, event }) => {
    emits('selected', row)
  },
  optionalConfig:{
    rowClassName({row}) {
      if(row.__dim) {
        return 'dimmed-row'
      }
      return ''
    },
    toolbarConfig:{
      zoom:false,
      custom:false,
      refresh:false,
      export:false,
    },
    virtualYConfig: {
      enabled: true,
      gt: 0
    },
  }
})

watch(items, (newItems) => {
  if(tableRef.value) {
    // (tableRef.value as any)?.reloadData(newItems)
    // tableRef.value.reload()o
  }
}, { deep: true})
// Expose scroll method to parent
function scrollToTop() {
  if (tableRef.value) {
    (tableRef.value as any)?.scrollTo(0, 0)
  }
}

defineExpose({
  scrollToTop
})

onMounted(() => {
  if(tableRef.value) {
    // (tableRef.value as any)?.reloadData(props.items)
  }
})
</script>
<template>
  <VxeGrid ref="tableRef" :data="items" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons></template>
    <template #icon="{ row }">
      <Icon :name="row.icon" />
    </template>

  </VxeGrid>
</template>

<style lang="scss" scoped>
  :deep(.dimmed-row){
    opacity: 0.5;
    // cursor: not-allowed;
  }

  :deep(mark.highlight) {
    background-color: yellow;
    color: var(--app-primary);
    font-weight: 600;
    border-radius: var(--app-border-radius-xs);
    padding: 0 2px;
  }
</style>
