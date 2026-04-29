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
    <div class="md-card-toolbar">
      <div class="toolbar-left">
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
            <el-button>
              <el-icon><Brush /></el-icon>
              样式
            </el-button>
          </template>
          <MdCardSettingStyle />
        </el-popover>
      </div>

      <div class="toolbar-right">
        <el-button :loading="refreshLoading" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="handleAddRow">
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
      </div>
    </div>

    <MdCardList
      :ref="cardRef"
      :draggable="props.editable"
    />
    <MdFormPopover
      ref="MdFormPopoverRef"
      :columns="columns"
      :systemFieldsTypes="systemFieldsTypes"
      showMoveButtons
      @submit="handleAddRowSubmit"
    />
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

.md-card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s);
  border-bottom: 1px solid #ebeef5;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-input {
    width: 240px;
  }
}

</style>
<style>
.md-card-setting-popover {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
