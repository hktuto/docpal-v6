<script lang="ts" setup>
import type { Database, NavItem, Table, View, Dashboard } from '../../types/database'
import { Grid, Postcard, DataAnalysis, Folder } from '@element-plus/icons-vue'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'

const props = defineProps<{
  database: Database
  folder: NavItem
}>()

const emit = defineEmits<{
  back: []
  selectTable: [tableId: string]
  selectView: [tableId: string, viewId: string]
  selectDashboard: [dashboardId: string]
  selectFolder: [folderId: string]
  addItem: [itemType: 'table' | 'view' | 'dashboard' | 'folder']
  renameFolder: []
  deleteFolder: []
}>()

// Get items in this folder
const folderItems = computed(() => {
  return props.folder.children || []
})

// Resolve item details (table/view/dashboard names)
function getItemDetails(item: NavItem) {
  if (item.type === 'table' && item.targetId) {
    const table = props.database.tables.find(t => t.id === item.targetId)
    return {
      name: table?.name || item.label,
      description: table?.description || '',
      icon: Grid
    }
  }
  
  if (item.type === 'view' && item.targetId && item.targetTableId) {
    const table = props.database.tables.find(t => t.id === item.targetTableId)
    const view = table?.views.find(v => v.id === item.targetId)
    return {
      name: view?.name || item.label,
      description: `View of ${table?.name || 'table'}`,
      icon: Postcard
    }
  }
  
  if (item.type === 'dashboard' && item.targetId) {
    const dashboard = props.database.dashboards.find(d => d.id === item.targetId)
    return {
      name: dashboard?.name || item.label,
      description: dashboard?.scope === 'database' ? 'Database Dashboard' : 'Table Dashboard',
      icon: DataAnalysis
    }
  }
  
  if (item.type === 'folder') {
    const childCount = item.children?.length || 0
    return {
      name: item.label,
      description: `${childCount} item${childCount !== 1 ? 's' : ''}`,
      icon: Folder
    }
  }
  
  return {
    name: item.label,
    description: '',
    icon: Grid
  }
}

// Handle item click
function handleItemClick(item: NavItem) {
  if (item.type === 'table' && item.targetId) {
    emit('selectTable', item.targetId)
  } else if (item.type === 'view' && item.targetId && item.targetTableId) {
    emit('selectView', item.targetTableId, item.targetId)
  } else if (item.type === 'dashboard' && item.targetId) {
    emit('selectDashboard', item.targetId)
  } else if (item.type === 'folder') {
    emit('selectFolder', item.id)
  }
}

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    to: () => emit('back')
  },
  {
    label: props.folder.label
  }
])

// Header actions for UnifiedHeader
const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'add-table',
    label: 'Add Table',
    action: () => emit('addItem', 'table')
  },
  {
    code: 'add-view',
    label: 'Add View',
    action: () => emit('addItem', 'view')
  },
  {
    code: 'add-dashboard',
    label: 'Add Dashboard',
    action: () => emit('addItem', 'dashboard')
  },
  {
    code: 'add-folder',
    label: 'Add Folder',
    action: () => emit('addItem', 'folder')
  },
  {
    code: 'rename-folder',
    label: 'Rename Folder',
    divided: true,
    action: () => emit('renameFolder')
  },
  {
    code: 'delete-folder',
    label: 'Delete Folder',
    icon: '🗑️',
    danger: true,
    action: () => emit('deleteFolder')
  }
])
</script>

<template>
  <div class="folder-view">
    <!-- Unified Header -->
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'database',
        database: props.database
      }"
      :actions="headerActions"
      :show-collaborators="false"
    />

    <!-- Folder Content -->
    <div class="folder-content">
      <div v-if="folderItems.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>Empty Folder</h3>
        <p>This folder doesn't contain any items yet.</p>
        <el-button type="primary" @click="emit('addItem', 'table')">
          Add Your First Item
        </el-button>
      </div>

      <div v-else class="items-grid">
        <div
          v-for="item in folderItems"
          :key="item.id"
          class="item-card"
          @click="handleItemClick(item)"
        >
          <div class="item-icon">
            <el-icon :size="32">
              <component :is="getItemDetails(item).icon" />
            </el-icon>
          </div>
          <div class="item-content">
            <h4 class="item-name">{{ getItemDetails(item).name }}</h4>
            <p class="item-description">{{ getItemDetails(item).description }}</p>
          </div>
          <div class="item-type-badge">
            <el-tag size="small" :type="item.type === 'table' ? 'primary' : item.type === 'dashboard' ? 'success' : 'info'">
              {{ item.type }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.folder-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.folder-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-l);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--app-text-color-secondary);

  .empty-icon {
    font-size: 80px;
    margin-bottom: var(--app-space-m);
    opacity: 0.3;
  }

  h3 {
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--app-text-color-primary);
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    font-size: var(--app-font-size-m);
    margin: 0 0 var(--app-space-l) 0;
  }
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--app-space-m);
}

.item-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  padding: var(--app-space-l);
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: var(--app-primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--app-fill-color-lighter);
  border-radius: var(--app-border-radius-m);
  color: var(--app-primary-color);
}

.item-content {
  flex: 1;
}

.item-name {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--app-text-color-primary);
  margin: 0 0 var(--app-space-xxs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-description {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-type-badge {
  position: absolute;
  top: var(--app-space-s);
  right: var(--app-space-s);
}
</style>
