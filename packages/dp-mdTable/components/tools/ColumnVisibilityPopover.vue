<template>
  <el-popover ref="popoverRef" :width="320" trigger="click" popper-class="column-visibility-popover">
    <template #reference>
      <el-button type="default" @click="handleOpen">
        <el-icon><View /></el-icon>
        隐藏列
      </el-button>
    </template>
    <template #default>
      <div class="column-visibility-content">
        <div class="popover-header">
          <span class="header-title">设置列</span>
          <p class="header-tip">你的操作会同步给其他成员</p>
        </div>
        <el-input v-model="searchKeyword" placeholder="搜索" clearable class="search-input" :prefix-icon="Search" />
        <div class="column-list">
          <div v-for="col in columnsWithDisplay" :key="col.id" class="column-item">
            <span class="column-title">{{ col.title || col.id }}</span>
            <el-switch v-model="col.display" :loading="col.loading" @update:model-value="(v: boolean) => handleSwitch(col.id, v, col)" />
          </div>
        </div>
        <div class="popover-footer">
          <el-button size="small" @click="handleHideAll">隐藏所有</el-button>
          <el-button size="small" type="primary" @click="handleShowAll">显示所有</el-button>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { View, Search } from '@element-plus/icons-vue'

export interface ColumnVisibilityItem {
  id: string
  title: string
  display: boolean
}
const { columns, updatedViewConfigs, tableFields } = useMDTableInject()
const popoverRef = ref()
const searchKeyword = ref('')
const columnsWithDisplay = ref([])
function handleOpen() {
  searchKeyword.value = ''
  columnsWithDisplay.value = tableFields.value.map((c) => ({
    id: c.id,
    field: c.field_name,
    title: c.field_name_alias ?? c.field_name ?? c.id,
    display: columns.value.find((col) => col.field_name === c.field_name) ? true : false
  }))
}

async function handleSwitch(id: string, display: boolean, col: ColumnVisibilityItem) {
  col.loading = true
  await updatedViewConfigs([{ id: col.id, display: col.display }])
  setTimeout(() => {
    col.loading = false
  }, 1000)
}

async function handleHideAll() {
  updatedViewConfigs(tableFields.value.map((c) => ({ id: c.id, display: false })))
}

function handleShowAll() {
  updatedViewConfigs(tableFields.value.map((c) => ({ id: c.id, display: true })))
}

defineExpose({
  popoverRef
})
</script>

<style scoped lang="scss">
.column-visibility-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);

  .popover-header {
    .header-title {
      font-weight: 600;
      font-size: var(--app-font-size-m);
    }
    .header-tip {
      margin: 4px 0 0;
      font-size: var(--app-font-size-s);
      color: var(--el-text-color-secondary);
    }
  }

  .search-input {
    width: 100%;
  }

  .column-list {
    max-height: 280px;
    overflow-y: auto;

    .column-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .column-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .popover-footer {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
