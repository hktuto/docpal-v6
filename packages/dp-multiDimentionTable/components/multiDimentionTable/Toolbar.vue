<template>
  <div v-if="showToolbar" class="table-toolbar">
    <div class="toolbar-left">
      <slot name="toolbar-left">
        <!-- 分组功能 -->
        <el-dropdown trigger="click" @command="handleGroupCommand">
          <el-button size="small">
            <el-icon><Operation /></el-icon>
            分组
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="col in groupableColumns" :key="col.field" :command="col.field">
                <el-checkbox :model-value="activeGroupFields.includes(col.field)" @click.stop="toggleGroup(col.field)">
                  {{ col.title }}
                </el-checkbox>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button v-if="showRefresh" size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </slot>
    </div>
    <div class="toolbar-right">
      <slot name="toolbar-right">
        <el-input
          v-if="showSearch"
          v-model="searchValue"
          placeholder="搜索..."
          size="small"
          style="width: 200px; margin-right: 10px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button v-if="showExport" size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Refresh, Search, Download, Operation, DataAnalysis } from '@element-plus/icons-vue'

interface ColumnConfig {
  field: string
  title: string
  type?: string
  [key: string]: any
}

interface Props {
  showToolbar?: boolean
  showSearch?: boolean
  showRefresh?: boolean
  showExport?: boolean
  groupableColumns?: ColumnConfig[]
  activeGroupFields?: string[]
}

interface Emits {
  (e: 'refresh'): void
  (e: 'search', value: string): void
  (e: 'export'): void
  (e: 'group-toggle', field: string): void
  (e: 'update:activeGroupFields', fields: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showSearch: true,
  showRefresh: true,
  showExport: true,
  groupableColumns: () => [],
  activeGroupFields: () => []
})

const emit = defineEmits<Emits>()

const searchValue = ref('')

// 使用 computed 来管理 activeGroupFields，支持 v-model
const activeGroupFields = computed({
  get: () => props.activeGroupFields || [],
  set: (value: string[]) => {
    emit('update:activeGroupFields', value)
  }
})
const handleRefresh = () => {
  emit('refresh')
}

const handleSearch = (value: string) => {
  emit('search', value)
}

const handleExport = () => {
  emit('export')
}

const handleGroupCommand = (field: string) => {
  toggleGroup(field)
}

const toggleGroup = (field: string) => {
  const currentFields = [...activeGroupFields.value]
  const index = currentFields.indexOf(field)
  if (index > -1) {
    currentFields.splice(index, 1)
  } else {
    currentFields.push(field)
  }
  activeGroupFields.value = currentFields
  emit('group-toggle', field)
}

// 暴露方法
defineExpose({
  searchValue,
  get activeGroupFields() {
    return activeGroupFields.value
  },
  toggleGroup
})
</script>

<style scoped lang="scss">
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>

