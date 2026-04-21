<script lang="ts" setup>

import { useMDKanbanInject } from '../../composables/mdKanban/useMDKanban'


const props = defineProps<{
  field: string,
  group: {
    id: string,
    label: string,
  },
  tableId: string,
}>()


const groupRef = ref<HTMLDivElement>()
const loadMoreRef = ref<HTMLDivElement>()
const hasLoaded = ref(false)
const loadingMore = ref(false)
const { updateViewFilterSortGroup, columns, tableFields, systemFieldsTypes } = useMDKanbanInject()

const emit = defineEmits(['needRefresh'])

function getPageParams(){
  const params:any = {
    // dryRun: true,
  }
  params.conditions = [{
     type: 'AND',
     value:[
       {
         column: props.field,
         type: "EQ",
         value: props.group.id
       }
     ]
  }]
  params.columns = [
    {
      name: '*'
    }
  ]
  return params
}
const MdFormPopoverRef = ref()
provide('viewTools', { getPageParams, columns, tableFields })
function openAddRow() {
  MdFormPopoverRef.value?.open({
    [props.field]: props.group.id,
  })
}


const listRef = ref()

function refresh(){
  listRef.value?.refresh()
}

function handleItemMoved({ sourceGroupId }: { sourceGroupId: string }) {
  emit('needRefresh', sourceGroupId)
}

const selectedRow = ref<any>()
function openRecordDetail(item: any) {
  selectedRow.value = item
  MdFormPopoverRef.value?.open(item)
}
async function handleAddRowSubmit(data: any) {
  console.log('handleAddRowSubmit', data, props.field, props.group.id)
  if (selectedRow.value) {
    await listRef.value?.updateRow(selectedRow.value.id, data, props.tableId)
    selectedRow.value = null
  }else{
    await listRef.value?.addRow(data)
  }
  // await addRow(data)
  // check if data[props.field] === props.group.id
  //
  if (data[props.field] !== props.group.id) {
    console.log('needToRefresh', data[props.field], props.group.id)
    setTimeout(() => {
      emit('needRefresh', data[props.field])
    },1000)
  }
  refresh()
}


defineExpose({
  refresh,
  groupId: props.group.id,
})

</script>

<template>
    <div ref="groupRef" class="group">
        <MdKanbanGroupList
          ref="listRef"
          :field="props.field"
          :group="props.group"
          :table-id="props.tableId"
          @select="openRecordDetail"
          @itemMoved="handleItemMoved"
        />
        <div class="addSection">
            <ElButton type="link" @click="openAddRow">+ Add</ElButton>
        </div>
        <MdFormPopover
          ref="MdFormPopoverRef"
          :columns="columns"
          :systemFieldsTypes="systemFieldsTypes"
          showMoveButtons
          @submit="handleAddRowSubmit"
        />
    </div>
</template>
<style lang="scss" scoped>
.group {
    display: grid;
    grid-template-rows: 1fr min-content;
    gap: 0;
    overflow: hidden;
    position: relative;
}
.list{
    padding: var(--group-space);
    display: flex;
    flex-flow: column;
    gap: var(--app-space-xs);
    overflow: auto;
}
.list.drag-over{
    background-color: var(--app-color-bg-hover, rgba(0,0,0,0.05));
    outline: 2px dashed var(--app-primary);
    outline-offset: -2px;
}
.load-more-sentinel {
    height: 20px;
    flex-shrink: 0;
}
.addSection{
    width:100%;
    padding: var(--group-space);
    border-top: 1px solid var(--app-grey-800);
}
</style>
