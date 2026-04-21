<script lang="ts" setup>
import  { useMDKanban, type MDKanbanProps } from '../../composables/mdKanban/useMDKanban'
import { MoreFilled } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
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
function openSetting() {
  kanbanSettingRef.value.open()
}


async function handleDragEnd(event: any){
  const { oldIndex, newIndex } = event
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
    return
  }
  await props.extraColumnConfig?.updateViewFilterSortGroup?.('style', viewStyleConfig.value)

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
const gorupRef = ref<any>({})
function handleNeedRefresh(groupId: string) {
  const index = viewStyleConfig.value.options.findIndex((option) => option.id === groupId)
  if(index === -1) return
  gorupRef.value[index]?.refresh()
}

onMounted(() => {
  if(viewStyleConfig.value && !viewStyleConfig.value.selectedColumnId || (!viewStyleConfig.value.options || !viewStyleConfig.value.options.length)){
    nextTick(() => {
      openSetting()
    })
  }
})

</script>


<template>
<div class="kanbanViewContainer">
    <template v-if="viewStyleConfig.selectedColumnId">

    <div class="allData groups">
        <div class="title">
            <span class="text">All Data</span>
        </div>
    </div>
     <draggable v-model="viewStyleConfig.options" item-key="id" tag="div" class="group_list" :animation="150" handle=".title" @end="handleDragEnd">
         <template #item="{ element: option }">
            <div
                class="groups"
                :style="{ '--color': option.color }"
            >
                <div class="title">
                    <div class="color" ></div>
                    <span class="text">{{option.label}}</span>
                    <el-button text size="small" :icon="MoreFilled" class="optionsBtn" />
                </div>
                <MdKanbanGroup ref="gorupRef" :group="option" :field="viewStyleConfig.selectedColumnId" :table-id="props.tableId" @needRefresh="handleNeedRefresh" />
            </div>
         </template>
     </draggable>

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
