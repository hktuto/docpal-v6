<script lang="ts" setup>
import  { useMDKanban, type MDKanbanProps } from '../../composables/mdKanban/useMDKanban'
import { MoreFilled } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'

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
const { columns, cardRef, getTableData, addRow, systemFieldsTypes, viewStyleConfig } = useMDKanban(props)


// open setting logic
const kanbanSettingRef = ref()
function initSetting() {
  // check if viewStyleConfig has already selected a column
  if (viewStyleConfig.value && viewStyleConfig.value.selectedColumnId) {
    return
  }
  // check if columns has single select field

  const selectColumn = columns.value.filter((col) => col.business_type === '3')

  if (selectColumn && selectColumn.length == 1) {
    // only one select column, auto selecte this column
    viewStyleConfig.value.selectedColumnId = selectColumn[0].field_name
    viewStyleConfig.value.options = selectColumn[0].display_structure.options
    props.extraColumnConfig?.updatedViewFilterSortGroup?.('style', viewStyleConfig.value)

  } else {
    openSetting()
  }
}
function openSetting() {
  kanbanSettingRef.value.open()
}


const groupListRef = ref<HTMLDivElement>()
const sortableInstance = ref<any>()

function initSortable() {
  if (!groupListRef.value) return
  sortableInstance.value = Sortable.create(groupListRef.value, {
    handle: '.title',
    animation: 150,
    onEnd: async (event) => {
      const { oldIndex, newIndex } = event
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
        return
      }
      const options = viewStyleConfig.value.options
      const movedItem = options.splice(oldIndex, 1)[0]
      options.splice(newIndex, 0, movedItem)
      await props.extraColumnConfig?.updateViewFilterSortGroup?.('style', viewStyleConfig.value)
    }
  })
}



watch(viewStyleConfig ,(style) => {
  if(style && !style.selectedColumnId || (!style.options || !style.options.length)){
    nextTick(() => {
      openSetting()
    })
  }
},{
  deep: true,
})
const groupRef = ref<Record<string, any>>({})
function handleNeedRefresh(groupId: string = 'all') {
  const items = Array.isArray(groupRef.value) ? groupRef.value : groupRef.value ? [groupRef.value] : []
  items.forEach((el: any) => {
    if (el?.groupId === groupId) {
      el.refresh()
    }
  })
}

onMounted(() => {
  initSortable()
  initSetting()
})

onBeforeUnmount(() => {
  sortableInstance.value?.destroy()
})

</script>


<template>
<div class="kanbanViewContainer">
    <template v-if="viewStyleConfig.selectedColumnId">

    <div class="allData groups">
        <div class="title">
            <span class="text">All Data</span>
        </div>
        <MdKanbanGroup
            ref="groupRef"
            :group="{ id: null, label: 'All Data' }"
            :field="viewStyleConfig.selectedColumnId"
            :table-id="props.tableId"
            @needRefresh="handleNeedRefresh"
        />
    </div>
     <div ref="groupListRef" class="group_list">
         <div
             v-for="option in viewStyleConfig.options"
             :key="option.id"
             class="groups"
             :style="{ '--color': option.color }"
         >
             <div class="title">
                 <div class="color" ></div>
                 <span class="text">{{option.label}}</span>
                 <el-button text size="small" :icon="MoreFilled" class="optionsBtn" />
             </div>
             <MdKanbanGroup ref="groupRef" :group="option" :field="viewStyleConfig.selectedColumnId" :table-id="props.tableId" @needRefresh="handleNeedRefresh" />
         </div>
     </div>

    <div class="newGroup">

    </div>
    </template>
    <MdKanbanSettingDialog :view-style-config="viewStyleConfig" ref="kanbanSettingRef" />
</div>
</template>

<style lang="scss" scoped>
.optionsBtn {
    color: var(--app-grey-300);
    :deep(.el-icon) {
      rotate: 90deg;
    }
}
.kanbanViewContainer{
    width:100%;
    height: 100%;
    overflow: auto;
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-xs);
    padding: var(--app-space-s);
}
.group_list{
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-xs);
}
.groups{
    --group-space: var(--app-space-s);
    flex: 0 0 220px;
    width: 220px;

    background: var(--app-paper);
    border-radius: var(--app-border-radius-s);
    overflow: hidden;
    display: grid;
    grid-template-rows:  min-content 1fr;
    gap: 0;
}
.color{
    width: var(--app-space-s);
    height: var(--app-space-s);
    border-radius: var(--app-border-radius-s);
    background: var(--color);
}
.title{
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-m);
    font-weight: bold;
    color: var(--app-grey-300);
    padding: var(--group-space);
    border-bottom: 1px solid var(--app-grey-800);
    cursor: grab;
}
.text{
    flex: 1 0 auto;
}
</style>
