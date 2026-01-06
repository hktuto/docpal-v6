<script lang="ts" setup>
import type{ WorkspaceType } from '../../../utils/db/schema/workspaces';

const props = defineProps<{
  items: WorkspaceType[]
}>()
const {items} = toRefs(props)

const { tableRef, tableConfig, tableEvent, reload } = useVxeTable({
  id: 'workspaces-table',
  columns: [
    { field: 'icon', title: '', slots: { default: 'icon' }, width: 50 },
    { field: 'name', title: 'Name' },
    { field: 'description', title: 'Description' },
    { field: 'createdDate', title: 'Created Date' },
    { field: 'updatedDate', title: 'Updated Date' },
  ],
  virtualScroll:true,
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
  console.log('newItems', newItems)
  if(tableRef.value) {
    (tableRef.value as any)?.reloadData(newItems)
    // tableRef.value.reload()
  }
}, { deep: true})
onMounted(() => {
  if(tableRef.value) {
    (tableRef.value as any)?.reloadData(props.items)
  }
})
</script>
<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
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
</style>
