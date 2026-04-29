<script setup lang="ts">
import { Refresh, Plus, Grid, Brush } from '@element-plus/icons-vue'
import MdCardList from './list.vue'
import type { MDCardProps } from '../../composables/mdCard/useMDCard'

const props = withDefaults(defineProps<MDCardProps>(), {
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
const refreshLoading = ref(false)
const { columns, cardRef, getTableData, addRow, systemFieldsTypes } = useMDCard(props)

async function handleRefresh() {
  refreshLoading.value = true
  await getTableData({ pageNum: 0 })
  emit('refresh')
  setTimeout(() => {
    refreshLoading.value = false
  }, 300)
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
  <div class="md-card-view">
    <ToolsBar :showColumnConfig="false" @refresh="handleRefresh" @add-row="handleAddRow">
      <template #toolbar-left-before>
        <el-popover placement="bottom-start" :width="280" trigger="click" popper-class="md-card-setting-popover">
          <template #reference>
            <el-button>
              <el-icon><Grid /></el-icon>
              布局
            </el-button>
          </template>
          <MdCardSettingLayout />
        </el-popover>
        <el-popover placement="bottom-start" :width="320" trigger="click" popper-class="md-card-setting-popover">
          <template #reference>
            <el-button style="margin-left: 0px">
              <el-icon><Brush /></el-icon>
              样式
            </el-button>
          </template>
          <MdCardSettingStyle />
        </el-popover>
      </template>
    </ToolsBar>

    <MdCardList :ref="cardRef" :draggable="props.editable" />
    <MdFormPopover ref="MdFormPopoverRef" :columns="columns" :systemFieldsTypes="systemFieldsTypes" showMoveButtons @submit="handleAddRowSubmit" />
  </div>
</template>

<style scoped lang="scss">
.md-card-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}
</style>
<style>
.md-card-setting-popover {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
