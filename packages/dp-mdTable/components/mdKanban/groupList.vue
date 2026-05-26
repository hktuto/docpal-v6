<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps<{
  field: string,
  group: {
    id: string | null,
    label: string,
  },
  tableId: string,
}>()
const currentRow = ref(null)
const listElRef = ref()
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
const isIntersectingState = ref(false)
const emits = defineEmits(['select', 'itemMoved'])
const loadMoreRef = ref()
const isDragOver = ref(false)
const pageSize = 20
const extraParams = computed(() => {
  const groupCondition = props.group.id || ''
  return {
    conditions: [
      {
        type: 'AND',
        value: [
          {
            column: props.field,
            type: 'EQ',
            value: groupCondition
          }
        ]
      }
    ]
  }
})
const { tableData, totalSize, loading,  hasMore, updateRow,  addRow, getTableData, loadMore } = useTableData(props.tableId, listRef)
const localKey = ref(1)
async function refresh(){
  if(!isIntersectingState.value) return
  tableData.value = []
  localKey.value ++
  nextTick(async() => {
    await getTableData({
       pageSize: pageSize,
   }, extraParams.value)
  })
}


const { stop } = useIntersectionObserver(
  listElRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !hasMore.value) {
      hasMore.value = true
      isIntersectingState.value = true
      nextTick(() => {
        refresh()
      })
    }else{
      isIntersectingState.value = false
    }
  },
  {
    threshold: 0
  }
)

const { stop: stopLoadMore } = useIntersectionObserver(
  loadMoreRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value && hasMore.value) {
      loadMore(extraParams.value)
    }
  },
  {
    root: listElRef,
    rootMargin: '0px 0px 200px 0px',
    threshold: 0
  }
)


function openRecordDetail(item: any) {
  if(item.__deleted) return
  emits('select', item)
}

function handleDragStart(event: DragEvent, item: any) {
  event.dataTransfer?.setData('application/json', JSON.stringify({
    itemId: item.id,
    sourceGroupId: props.group.id
  }))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const data = event.dataTransfer?.getData('application/json')
  if (!data) return

  const { itemId, sourceGroupId } = JSON.parse(data)
  if (sourceGroupId === props.group.id) return

  await updateRow(itemId, { [props.field]: props.group.id || '' }, props.tableId)
  emits('itemMoved', { itemId, sourceGroupId })
  refresh()
}




onBeforeUnmount(() => {
  stop()
  stopLoadMore()
})

defineExpose({
  refresh,
  addRow,
  updateRow,
})

</script>

<template>
<div
  ref="listElRef"
  class="list"
  :class="{ 'drag-over': isDragOver }"
  @dragover.prevent="isDragOver = true"
  @dragleave="isDragOver = false"
  @drop="handleDrop"
>
     <MdKanbanGroupItem
       v-for="item in tableData"
       :key="localKey + item.id"
       :item="item"
       :field="props.field"
       draggable="true"
       @dragstart="handleDragStart($event, item)"
       @click="openRecordDetail(item)"
     />
    <div v-if="hasMore" ref="loadMoreRef" class="load-more-sentinel"></div>
</div>
</template>
