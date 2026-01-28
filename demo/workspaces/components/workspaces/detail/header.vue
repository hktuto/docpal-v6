<script lang="ts" setup>
import type { WorkspaceRouteParams, TreeItem } from '../../../composables/useSingleWorkspace'
import type { CaseTableRecord } from '../../../utils/db/schema/newTableSchema'
import { ArrowDown, Folder, Grid, Postcard, DataAnalysis, Document } from '@element-plus/icons-vue'

const { workspaceRouteParams, workspace, menuState, navigateToItem, findItemById, goBackFromRecord } = useSingleWorkspaceContext()
const { query } = usePglite()

defineSlots<{
  default?: (props: {}) => any
  left?: (props: {}) => any
  right?: (props: {}) => any
}>()

type BreadcrumbItem = {
  label: string
  params: WorkspaceRouteParams
  isFolder: boolean
  isRecord?: boolean // Flag for record items
  children?: TreeItem[] // Children items for dropdown (only for folders)
  itemId?: string | null // Original item ID for finding children
}

// Record title for breadcrumb when viewing a record
const recordTitle = ref<string>('')

const breadcrumbList = ref<BreadcrumbItem[]>([])

/**
 * Recursively find the path from root to the target item
 * Returns true if target is found, path will be built in result array
 */
function findPathToItem(items: TreeItem[], targetId: string, path: BreadcrumbItem[]): boolean {
  for (const item of items) {
    // Add current item to path
    const breadcrumbItem: BreadcrumbItem = {
      label: item.label,
      params: {
        detailId: item.id,
        detailType: item.itemType,
        pageType: 'detail'
      },
      isFolder: item.itemType === 'folder',
      itemId: item.id,
      children: item.itemType === 'folder' ? item.children : undefined
    }
    path.push(breadcrumbItem)

    // Check if this is the target
    if (item.id === targetId) {
      return true
    }

    // Search in children if exists
    if (item.children && item.children.length > 0) {
      if (findPathToItem(item.children, targetId, path)) {
        return true
      }
    }

    // Not found in this branch, remove from path
    path.pop()
  }
  return false
}

async function createBreadcrumb() {
  // Always start with root (workspace)
  const rootItem: BreadcrumbItem = {
    label: workspace.value?.name || '',
    params: {
      detailId: null,
      detailType: 'root',
      pageType: 'detail'
    },
    isFolder: true, // Workspace root acts like a folder
    itemId: null,
    children: menuState.value.items // Root children are the top-level items
  }

  // Handle record detail view
  if (workspaceRouteParams.value.detailType === 'record' && workspaceRouteParams.value.tableId) {
    const tableId = workspaceRouteParams.value.tableId
    const recordId = workspaceRouteParams.value.recordId
    
    // Find the table's menu item to get the path
    const tableMenuItem = findTableMenuItemById(menuState.value.items, tableId)
    
    if (tableMenuItem) {
      // Build path to table
      const path: BreadcrumbItem[] = []
      findPathToItem(menuState.value.items, tableMenuItem.id, path)
      
      // Load record title if not already loaded
      if (recordId && !recordTitle.value) {
        await loadRecordTitle(tableId, recordId)
      }
      
      // Add record item to breadcrumb
      const recordItem: BreadcrumbItem = {
        label: recordTitle.value || `Record`,
        params: {
          detailId: null,
          detailType: 'record',
          pageType: 'detail'
        },
        isFolder: false,
        isRecord: true,
        itemId: recordId
      }
      
      breadcrumbList.value = [rootItem, ...path, recordItem]
    } else {
      // Fallback if table not found in menu
      const recordItem: BreadcrumbItem = {
        label: recordTitle.value || `Record`,
        params: {
          detailId: null,
          detailType: 'record',
          pageType: 'detail'
        },
        isFolder: false,
        isRecord: true,
        itemId: recordId
      }
      breadcrumbList.value = [rootItem, recordItem]
    }
    return
  }

  if (workspaceRouteParams.value.detailType === 'root' || !workspaceRouteParams.value.detailId) {
    breadcrumbList.value = [rootItem]
    return
  }

  // Build path to current item
  const path: BreadcrumbItem[] = []
  findPathToItem(menuState.value.items, workspaceRouteParams.value.detailId, path)

  breadcrumbList.value = [rootItem, ...path]
}

/**
 * Find menu item by table ID (itemId)
 */
function findTableMenuItemById(items: TreeItem[], tableId: string): TreeItem | undefined {
  for (const item of items) {
    if (item.itemType === 'table' && item.itemId === tableId) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findTableMenuItemById(item.children, tableId)
      if (found) return found
    }
  }
  return undefined
}

/**
 * Load record title from database
 */
async function loadRecordTitle(tableId: string, recordId: string) {
  try {
    // Get table info to find physical table name
    const tableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [tableId]
    )
    
    if (tableData.length === 0) {
      recordTitle.value = `Record ${recordId.slice(0, 8)}...`
      return
    }
    
    const table = tableData[0]
    const physicalTableName = table.tableName
    
    // Get record data
    const records = await query<Record<string, any>>(
      `SELECT * FROM "${physicalTableName}" WHERE id = $1`,
      [recordId]
    )
    
    if (records.length === 0) {
      recordTitle.value = `Record ${recordId.slice(0, 8)}...`
      return
    }
    
    const record = records[0]
    
    // Try to find a suitable title field
    // First try common title field names
    const titleFieldNames = ['name', 'title', 'label', 'subject', 'display_name']
    for (const fieldName of titleFieldNames) {
      if (record[fieldName] && typeof record[fieldName] === 'string') {
        recordTitle.value = record[fieldName]
        return
      }
    }
    
    // Otherwise use the first non-id string field
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'id' && typeof value === 'string' && value.length > 0 && !key.startsWith('_')) {
        recordTitle.value = value.length > 50 ? value.slice(0, 50) + '...' : value
        return
      }
    }
    
    // Fallback to truncated ID
    recordTitle.value = `Record ${recordId.slice(0, 8)}...`
  } catch (error) {
    console.error('Error loading record title:', error)
    recordTitle.value = `Record ${recordId.slice(0, 8)}...`
  }
}

function handleBreadcrumbClick(item: BreadcrumbItem) {
  // Clear record title when navigating away
  recordTitle.value = ''
  
  if (item.params.detailType === 'root') {
    // If currently viewing a record, use goBackFromRecord
    if (workspaceRouteParams.value.detailType === 'record') {
      goBackFromRecord()
      // Then navigate to root
      navigateToItem(undefined)
    } else {
      navigateToItem(undefined)
    }
  } else if (item.params.detailId) {
    // If currently viewing a record and clicking on a breadcrumb item
    if (workspaceRouteParams.value.detailType === 'record') {
      goBackFromRecord()
    }
    
    const menuItem = findItemById(menuState.value.items, item.params.detailId)
    if (menuItem) {
      navigateToItem(menuItem)
    }
  }
}

function handleDropdownItemClick(item: TreeItem) {
  // Clear record title when navigating away
  if (workspaceRouteParams.value.detailType === 'record') {
    recordTitle.value = ''
    goBackFromRecord()
  }
  navigateToItem(item)
}

watch(
  menuState,
  () => {
    createBreadcrumb()
  },
  {
    deep: true
  }
)

watch(
  workspaceRouteParams,
  (newParams, oldParams) => {
    // Reset record title when navigating away from record view
    if (oldParams?.detailType === 'record' && newParams?.detailType !== 'record') {
      recordTitle.value = ''
    }
    // Reset record title when record ID changes
    if (newParams?.detailType === 'record' && oldParams?.recordId !== newParams?.recordId) {
      recordTitle.value = ''
    }
    createBreadcrumb()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="headerContainer">
    <div class="headerLeft">
      <div class="header-left-slot">
        <slot name="left" />
      </div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="item.params.detailId ?? 'root'">
          <!-- Dropdown for folder items (except last item) -->
          <el-dropdown
            v-if="item.isFolder && index < breadcrumbList.length - 1"
            trigger="hover"
            placement="bottom-start"
            @command="handleDropdownItemClick"
            :hide-timeout="100"
            :show-timeout="100"
          >
            <span class="breadcrumb-link breadcrumb-dropdown">
              {{ item.label }}
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu v-if="item.children && item.children.length > 0" class="breadcrumb-dropdown-menu">
                <!-- Child items -->
                <el-dropdown-item
                  v-for="child in item.children"
                  :key="child.id"
                  :command="child"
                  :class="{ 'is-current': child.id === workspaceRouteParams.detailId }"
                >
                  <div class="dropdown-item-content">
                    <el-icon v-if="child.itemType === 'folder'" class="folder-icon">
                      <Folder />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'table'" class="table-icon">
                      <Grid />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'view'" class="view-icon">
                      <Postcard />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'dashboard'" class="dashboard-icon">
                      <DataAnalysis />
                    </el-icon>
                    <span class="dropdown-label">{{ child.label }}</span>
                    <span v-if="child.children && child.children.length > 0" class="dropdown-child-count"> ({{ child.children.length }}) </span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu v-else class="breadcrumb-dropdown-menu">
                <el-dropdown-item disabled>
                  <div class="dropdown-item-content">
                    <el-icon class="folder-icon">
                      <Folder />
                    </el-icon>
                    <span class="dropdown-label">Empty folder</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Regular clickable link for non-folder items or last item -->
          <span
            v-else-if="index < breadcrumbList.length - 1"
            class="breadcrumb-link"
            tabindex="0"
            @click="handleBreadcrumbClick(item)"
            @keydown.enter="handleBreadcrumbClick(item)"
          >
            {{ item.label }}
          </span>

          <!-- Current (last) item - not clickable -->
          <span v-else class="breadcrumb-current" :class="{ 'is-record': item.isRecord }">
            <el-icon v-if="item.isRecord" class="record-icon"><Document /></el-icon>
            {{ item.label }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="headerRight">
      <slot name="right" />
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.headerContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s) var(--app-space-m);
  height: var(--app-header-height);
  border-bottom: 1px solid var(--app-grey-900);
  background: var(--app-grey-950);
}

.headerLeft {
  display: flex;
  align-items: center;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;

  &:hover,
  &:focus {
    color: var(--el-color-primary);
  }
}

.breadcrumb-dropdown {
  padding-right: 4px;

  &:hover {
    .dropdown-icon {
      color: var(--el-color-primary);
    }
  }
}

.dropdown-icon {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}

.breadcrumb-current {
  color: var(--el-text-color-primary);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.is-record {
    .record-icon {
      color: var(--el-color-info);
    }
  }
}

.record-icon {
  font-size: 14px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.header-left-slot {
  display: flex;
  align-items: center;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  max-width: 300px;
}

.folder-icon {
  color: var(--el-color-warning);
}

.table-icon {
  color: var(--el-color-primary);
}

.view-icon {
  color: var(--el-color-success);
}

.dashboard-icon {
  color: var(--el-color-info);
}

.dropdown-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-child-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
  opacity: 0.8;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 12px;

  &.is-current {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;

    &:hover {
      background-color: var(--el-color-primary-light-8);
    }
  }
}

.breadcrumb-dropdown-menu {
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;

    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}
</style>
