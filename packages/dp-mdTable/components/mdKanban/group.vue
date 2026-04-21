<script lang="ts" setup>
import { useIntersectionObserver } from '@vueuse/core'
import { useMDKanbanInject } from '../../composables/mdKanban/useMDKanban'
import { postDynamicActions } from 'api'
import _default$5 from 'element-plus';
const props = defineProps<{
  field: string,
  group: {
    id: string,
    label: string,
  },
  tableId: string,
}>()
const currentRow = ref(null)

const groupRef = ref<HTMLDivElement>()
const loadMoreRef = ref<HTMLDivElement>()
const hasLoaded = ref(false)
const loadingMore = ref(false)
const { updateViewFilterSortGroup, columns, tableFields, systemFieldsTypes } = useMDKanbanInject()

const emit = defineEmits(['needRefresh'])
const listRef = ref({
  setCurrentRow: (row: any) => {
    currentRow.value = row
  },
  scrollToRow: (row: any) => {

  },
  commitProxy : async (command:string)=>{
    if (command === 'reload') {
      refresh()
    }
  }
})
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

const listElRef = ref()
// todo : need to setup viewTools to provide to useTableData




const { tableData, totalSize, loading,  hasMore, updateRow,  addRow, getTableData, loadMore } = useTableData(props.tableId, listRef)

function refresh(){
  console.log('refresh', props.group.id)
  tableData.value = []
  nextTick(async () => {
   await getTableData({
      pageSize: 5,
      additionalParams: getPageParams(),
    })
   console.log(props.group.id, tableData.value)
  })
}

const { stop } = useIntersectionObserver(
  groupRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !hasLoaded.value) {
      hasLoaded.value = true
      nextTick(() => {
        refresh()
      })
    }
  },
  {
    threshold: 0
  }
)

const { stop: stopLoadMore } = useIntersectionObserver(
  loadMoreRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasLoaded.value && hasMore.value) {

      loadMore({
        additionalParams: getPageParams(),
      })
    }
  },
  {
    root: listElRef,
    rootMargin: '0px 0px 200px 0px',
    threshold: 0
  }
)
const selectedRow = ref()
function openAddRow() {
  MdFormPopoverRef.value?.open({
    [props.field]: props.group.id,
  })
}
function openRecordDetail(item: any) {
  selectedRow.value = item
  MdFormPopoverRef.value?.open(item)
}
async function handleAddRowSubmit(data: any) {
  console.log('handleAddRowSubmit', data, props.field, props.group.id)
  if (selectedRow.value) {
    await updateRow(selectedRow.value.id, data, props.tableId)
    selectedRow.value = null
  }else{
    await addRow(data)
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

onBeforeUnmount(() => {
  stop()
  stopLoadMore()
})

defineExpose({
  refresh
})

</script>

<template>
    <div ref="groupRef" class="group">
        <div ref="listElRef" class="list">

             <MdKanbanGroupItem
             v-for="item in tableData" :key="item.id" :item="item" :field="props.field"     @click="openRecordDetail(item)"/>
            <div v-if="hasMore" ref="loadMoreRef" class="load-more-sentinel"></div>
        </div>
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
