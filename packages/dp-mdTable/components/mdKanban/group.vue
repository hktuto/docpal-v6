<script lang="ts" setup>

import { useMDKanbanInject } from '../../composables/mdKanban/useMDKanban'
import { MoreFilled } from '@element-plus/icons-vue'


const props = defineProps<{
  field: string,
  group: {
    id: string | null,
    label: string,
  },
  tableId: string,
  color?: string,
}>()


const groupRef = ref<HTMLDivElement>()
const loadMoreRef = ref<HTMLDivElement>()
const hasLoaded = ref(false)
const loadingMore = ref(false)
const { updateViewFilterSortGroup, columns, tableFields, systemFieldsTypes } = useMDKanbanInject()

const emit = defineEmits(['needRefresh', 'update-label', 'update-color'])

function getPageParams(){
  const params:any = {
    // dryRun: true,
  }
  if (props.group.id == null) {
    params.conditions = [{
      type: 'AND',
      value:[
        {
          column: props.field,
          type: "EQ",
          value:""
        }
      ]
    }]
  } else {
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
  }
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

function handleItemMoved({ sourceGroupId }: { sourceGroupId: string | null }) {
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
  // check if data[props.field] === props.group.id
  //
  if (data[props.field] !== props.group.id) {
    console.log('needToRefresh', data[props.field], props.group.id)
    setTimeout(() => {
      emit('needRefresh', data[props.field])
    },300)
  }
  refresh()
}

const colorPopoverRef = ref()

function handleLabelSave(value: string) {
  emit('update-label', { id: props.group.id, label: value })
}

function handleColorChange(value: string | null) {
  if (!value) return
  emit('update-color', { id: props.group.id, color: value })
  colorPopoverRef.value?.hide?.()
}


defineExpose({
  refresh,
  groupId: props.group.id || 'all',
})

</script>

<template>
    <div ref="groupRef" class="group" :style="color ? { '--color': color } : undefined">
        <div class="title">
            <ElPopover v-if="color" ref="colorPopoverRef" trigger="click" width="auto">
                <template #reference>
                    <div class="color" style="cursor: pointer;"></div>
                </template>
                <ElColorPicker
                    :model-value="props.color"
                    show-alpha
                    @change="handleColorChange"
                />
            </ElPopover>
            <uiInlineEditor
                class="text"
                :model-value="props.group.label"
                :editable="props.group.id !== null"
                @save="handleLabelSave"
            />
            <el-button v-if="props.group.id !== null" text size="small" :icon="MoreFilled" class="optionsBtn" />
        </div>
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
          :table-id="props.tableId"
          :systemFieldsTypes="systemFieldsTypes"
          :showMoveButtons="false"
          :showSourceButton="false"
          @submit="handleAddRowSubmit"
        />
    </div>
</template>
<style lang="scss" scoped>
.group {
    --group-space: var(--app-space-s);
    flex: 0 0 220px;
    width: 220px;
    background: var(--app-paper);
    border-radius: var(--app-border-radius-s);
    overflow: hidden;
    display: grid;
    grid-template-rows:  min-content 1fr min-content;
    gap: 0;
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
.color{
    width: var(--app-space-s);
    height: var(--app-space-s);
    border-radius: var(--app-border-radius-s);
    background: var(--color);
}
.text{
    flex: 1 0 auto;
}
.optionsBtn {
    color: var(--app-grey-300);
    :deep(.el-icon) {
      rotate: 90deg;
    }
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
