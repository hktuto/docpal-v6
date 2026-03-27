<script setup lang="ts">
import { Refresh, Plus, Grid, Brush } from '@element-plus/icons-vue'
import MdCardList from './list.vue'
import MdCardSettingLayout from './setting/layout.vue'
import MdCardSettingStyle from './setting/style.vue'
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
  'open-record': [params: { row: any; recordId: string }]
}>()

const { columns, cardRef, getTableData, loadMore, addRow, systemFieldsTypes } = useMDCard(props)

async function handleRefresh() {
  await getTableData({ pageNum: 1 })
  emit('refresh')
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
function handleOpenRecord(row: any) {
  emit('open-record', {
    row,
    recordId: row?.id || ''
  })
}

function handleLoadMore() {
  loadMore()
}

</script>

<template>
  <div class="md-card-view">
    <div class="md-card-toolbar">
      <div class="toolbar-left">
        <el-popover placement="bottom-start" :width="280" trigger="click">
          <template #reference>
            <el-button>
              <el-icon><Grid /></el-icon>
              布局
            </el-button>
          </template>
          <MdCardSettingLayout />
        </el-popover>

        <el-popover placement="bottom-start" :width="320" trigger="click">
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
        <el-button @click="handleRefresh">
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
      @open-record="handleOpenRecord"
      @load-more="handleLoadMore"
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
