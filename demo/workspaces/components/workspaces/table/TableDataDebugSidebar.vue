<script setup lang="ts">
import type { TreeItem } from '../../../composables/workspace/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord, CaseViewRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: TreeItem
  caseTable: CaseTableRecord | null
  caseFields: CaseFieldRecord[]
  caseViews: CaseViewRecord[]
  realTableData: any[]
  realTableError: string | null
}>()

const isCollapsed = ref(false)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <div class="table-data-debug-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <h3 v-if="!isCollapsed">Debug Data</h3>
      <el-button
        :icon="isCollapsed ? 'el-icon-arrow-left' : 'el-icon-arrow-right'"
        circle
        size="small"
        @click="toggleCollapse"
      >
        <Icon :name="isCollapsed ? 'material-symbols:chevron-left' : 'material-symbols:chevron-right'" />
      </el-button>
    </div>

    <div v-show="!isCollapsed" class="sidebar-content">
      <!-- Menu Item -->
      <div class="data-section">
        <h4>Tree Item</h4>
        <pre class="raw-data">{{ JSON.stringify(menuItem, null, 2) }}</pre>
      </div>

      <!-- Case Table Record -->
      <div class="data-section">
        <h4>case_tables Record</h4>
        <pre class="raw-data">{{ JSON.stringify(caseTable, null, 2) }}</pre>
      </div>

      <!-- Case Fields -->
      <div class="data-section">
        <h4>case_fields ({{ caseFields.length }})</h4>
        <pre class="raw-data">{{ JSON.stringify(caseFields, null, 2) }}</pre>
      </div>

      <!-- Case Views -->
      <div class="data-section">
        <h4>case_views ({{ caseViews.length }})</h4>
        <pre class="raw-data">{{ JSON.stringify(caseViews, null, 2) }}</pre>
      </div>

      <!-- Real Table Data -->
      <div class="data-section">
        <h4>
          Real Table: "{{ caseTable?.tableName }}" 
          ({{ realTableData.length }}{{ realTableData.length >= 100 ? '+' : '' }} rows)
        </h4>
        <el-alert
          v-if="realTableError"
          :title="realTableError"
          type="error"
          :closable="false"
          show-icon
          class="table-error"
        />
        <pre v-else class="raw-data">{{ JSON.stringify(realTableData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-data-debug-sidebar {
  display: flex;
  flex-direction: column;
  width: 400px;
  min-width: 400px;
  height: 100%;
  background: var(--el-fill-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
  transition: width 0.2s, min-width 0.2s;
  overflow: hidden;
  
  &.collapsed {
    width: 48px;
    min-width: 48px;
    
    .sidebar-header {
      justify-content: center;
    }
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .el-button {
    flex-shrink: 0;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-section {
  background: var(--el-bg-color);
  border-radius: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  
  h4 {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .raw-data {
    margin: 0;
    padding: 8px;
    background: var(--el-fill-color-light);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .table-error {
    margin-top: 8px;
  }
}
</style>
