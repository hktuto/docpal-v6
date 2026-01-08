<script lang="ts" setup>
import type { Database, Table, View, Dashboard, ViewType, ViewConfig, NavItem, NavItemType } from '../../types/database'
import {ArrowLeft, Edit, Delete, Setting, Grid, Download} from '@element-plus/icons-vue'
import { useDatabase, useTable } from '../../composables/useDatabase'
import { useView } from '../../composables/useView'
import ViewRenderer from './ViewRenderer.vue'
import ViewPage from './ViewPage.vue'
import RecordDetailView from './RecordDetailView.vue'
import RecordDetailWithLayout from './RecordDetailWithLayout.vue'
import DashboardView from './DashboardView.vue'
import AddViewDialog from './AddViewDialog.vue'
import EditViewDialog from './EditViewDialog.vue'
import DatabaseSettings from './DatabaseSettings.vue'
import CreatePersonalViewDialog from './CreatePersonalViewDialog.vue'
import NavigationTree from './NavigationTree.vue'
import FolderView from './FolderView.vue'
import TableSettingsPage from './TableSettingsPage.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const props = defineProps<{
  database: Database
}>()

const emit = defineEmits<{
  back: []
}>()

const { getDatabaseById, updateNavigation, addNavigationItem, updateNavigationItem, createDashboard, exportAndDownloadDatabase, exportAndDownloadAllData } = useDatabase()

// Current database (reactive)
const currentDb = computed(() => getDatabaseById(props.database.id))

// Navigation state
type SelectedContentType = 'table' | 'dashboard' | 'folder' | 'settings' | 'table-settings'
const selectedType = ref<SelectedContentType>('table')
const selectedTableId = ref<string | null>(null)
const selectedViewId = ref<string | null>(null)
const selectedDashboardId = ref<string | null>(null)
const selectedFolderId = ref<string | null>(null)
const selectedRecordId = ref<string | null>(null)

// Initialize with first table and its default view
watchEffect(() => {
  if (currentDb.value?.tables.length && !selectedTableId.value) {
    const firstTable = currentDb.value.tables[0]
    selectedTableId.value = firstTable.id
    const defaultView = firstTable.views.find((v: View) => v.isDefault) || firstTable.views[0]
    if (defaultView) {
      selectedViewId.value = defaultView.id
    }
  }
})

const selectedTable = computed(() => {
  if (!currentDb.value || !selectedTableId.value) return null
  return currentDb.value.tables.find((t: Table) => t.id === selectedTableId.value) || null
})

const selectedView = computed(() => {
  if (!selectedTable.value || !selectedViewId.value) return null
  return selectedTable.value.views.find((v: View) => v.id === selectedViewId.value) || null
})

// Check if the selected view is a personal view (non-default, user-created)
const isPersonalView = computed(() => {
  if (!selectedView.value) return false
  return !selectedView.value.isDefault
})

const selectedDashboard = computed(() => {
  if (!currentDb.value || !selectedDashboardId.value) return null
  return currentDb.value.dashboards.find((d: Dashboard) => d.id === selectedDashboardId.value) || null
})

// Find folder in navigation tree (recursive)
function findFolderById(folderId: string, items: NavItem[]): NavItem | null {
  for (const item of items) {
    if (item.id === folderId && item.type === 'folder') {
      return item
    }
    if (item.children) {
      const found = findFolderById(folderId, item.children)
      if (found) return found
    }
  }
  return null
}

const selectedFolder = computed(() => {
  if (!currentDb.value || !selectedFolderId.value || !currentDb.value.navigation) return null
  return findFolderById(selectedFolderId.value, currentDb.value.navigation)
})

// Sidebar collapsed state
const sidebarCollapsed = ref(false)

// Section collapse states (kept for legacy dialogs)
const sectionsCollapsed = ref({
  tables: false,
  dashboards: false,
  myViews: false
})

function toggleSection(section: 'tables' | 'dashboards' | 'myViews') {
  sectionsCollapsed.value[section] = !sectionsCollapsed.value[section]
}

// Navigation active item tracking
const activeNavItemId = computed(() => {
  if (selectedType.value === 'folder' && selectedFolderId.value) {
    return selectedFolderId.value
  }
  if (selectedType.value === 'dashboard' && selectedDashboardId.value) {
    return selectedDashboardId.value
  }
  if (selectedType.value === 'table' && selectedViewId.value && !selectedView.value?.isDefault) {
    // Personal view is active
    return selectedViewId.value
  }
  if (selectedType.value === 'table' && selectedTableId.value) {
    return selectedTableId.value
  }
  return undefined
})

const activeNavItemType = computed((): 'table' | 'view' | 'dashboard' | 'folder' | undefined => {
  if (selectedType.value === 'folder') return 'folder'
  if (selectedType.value === 'dashboard') return 'dashboard'
  if (selectedType.value === 'table' && selectedViewId.value && !selectedView.value?.isDefault) {
    return 'view'
  }
  if (selectedType.value === 'table') return 'table'
  return undefined
})

// Navigation handlers
function handleNavSelectTable(tableId: string) {
  const table = currentDb.value?.tables.find(t => t.id === tableId)
  if (table) {
    handleSelectTable(table)
  }
}

function handleNavSelectView(tableId: string, viewId: string) {
  const table = currentDb.value?.tables.find(t => t.id === tableId)
  const view = table?.views.find(v => v.id === viewId)
  if (table && view) {
    handleSelectView(table, view)
  }
}

function handleNavSelectDashboard(dashboardId: string) {
  const dashboard = currentDb.value?.dashboards.find(d => d.id === dashboardId)
  if (dashboard) {
    handleSelectDashboard(dashboard)
  }
}

function handleNavSelectFolder(folderId: string) {
  selectedType.value = 'folder'
  selectedFolderId.value = folderId
  selectedRecordId.value = null
}

function handleNavToggleFolder(folderId: string) {
  // State is managed in NavigationTree
}

// Track parent folder for view creation
const createViewParentId = ref<string | null>(null)

// Handle add item from navigation tree
async function handleNavAddItem(parentId: string | null, itemType: NavItemType) {
  if (!currentDb.value) return
  
  // For views, skip the name prompt and go directly to the dialog
  if (itemType === 'view') {
    if (!currentDb.value.tables.length) {
      ElMessage.warning('Please create a table first before adding views')
      return
    }
    // Store parent for later use when view is created
    createViewParentId.value = parentId
    showCreatePersonalViewDialog.value = true
    return
  }
  
  try {
    // Prompt for name based on item type
    const typeLabels: Record<NavItemType, string> = {
      folder: 'Folder',
      table: 'Table',
      view: 'View',
      dashboard: 'Dashboard'
    }
    
    const { value: name } = await ElMessageBox.prompt(
      `Enter a name for the new ${typeLabels[itemType].toLowerCase()}`,
      `Add ${typeLabels[itemType]}`,
      {
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputPattern: /^.+$/,
        inputErrorMessage: 'Name is required'
      }
    )
    
    if (!name) return
    
    if (itemType === 'table') {
      // Create actual table and add to navigation
      const { createTable } = useDatabase()
      const newTable = createTable(props.database.id, { name })
      
      if (newTable) {
        // Add to navigation
        addNavigationItem(props.database.id, parentId, 'table', {
          label: name,
          targetId: newTable.id,
          icon: 'grid'
        })
        
        // Select the new table
        selectedTableId.value = newTable.id
        selectedViewId.value = newTable.views[0]?.id || null
        selectedType.value = 'table'
        
        ElMessage.success(`Table "${name}" created`)
      }
    } else if (itemType === 'dashboard') {
      // Create actual dashboard in database
      const newDashboard = createDashboard(props.database.id, { name })
      
      if (newDashboard) {
        // Add to navigation with targetId
        addNavigationItem(props.database.id, parentId, 'dashboard', {
          label: name,
          targetId: newDashboard.id,
          icon: 'data-analysis'
        })
        
        // Select the new dashboard
        selectedType.value = 'dashboard'
        selectedDashboardId.value = newDashboard.id
        
        ElMessage.success(`Dashboard "${name}" created`)
      }
    } else if (itemType === 'folder') {
      // Add folder to navigation
      addNavigationItem(props.database.id, parentId, 'folder', {
        label: name,
        icon: 'folder'
      })
      ElMessage.success(`Folder "${name}" created`)
    }
  } catch {
    // User cancelled
  }
}

// Handle navigation update (reorder)
function handleNavUpdateNavigation(navigation: NavItem[]) {
  if (!currentDb.value) return
  
  updateNavigation(props.database.id, navigation)
}

// Get all user-created views (non-default views) from all tables
const userViews = computed(() => {
  if (!currentDb.value) return []
  const views: Array<{ table: Table; view: View }> = []
  
  for (const table of currentDb.value.tables) {
    for (const view of table.views) {
      // Only include non-default views (user-created)
      if (!view.isDefault) {
        views.push({ table, view })
      }
    }
  }
  
  return views
})

function handleSelectView(table: Table, view: View) {
  selectedType.value = 'table'
  selectedTableId.value = table.id
  selectedViewId.value = view.id
  selectedRecordId.value = null
}

function handleSelectTable(table: Table) {
  selectedType.value = 'table'
  selectedTableId.value = table.id
  // Select the default view or first view
  const defaultView = table.views.find(v => v.isDefault) || table.views[0]
  selectedViewId.value = defaultView?.id || null
  selectedRecordId.value = null
}

function handleSelectDashboard(dashboard: Dashboard) {
  selectedType.value = 'dashboard'
  selectedDashboardId.value = dashboard.id
  selectedRecordId.value = null
}

function handleSelectFolder(folderId: string) {
  selectedType.value = 'folder'
  selectedFolderId.value = folderId
  selectedRecordId.value = null
}

function handleViewCreated(view: View) {
  // When a new view is created from ViewRenderer, automatically select it
  selectedViewId.value = view.id
  ElMessage.success(`View "${view.name}" created successfully`)
}

function handleOpenTableSettings() {
  selectedType.value = 'table-settings'
  selectedRecordId.value = null
}

function handleBackFromTableSettings() {
  selectedType.value = 'table'
}

function handleOpenRecord(tableId: string, recordId: string) {
  // Switch to the correct table if needed
  if (tableId !== selectedTableId.value) {
    const table = currentDb.value?.tables.find(t => t.id === tableId)
    if (table) {
      selectedTableId.value = tableId
      // Select the default view or first view of the target table
      const defaultView = table.views.find(v => v.isDefault) || table.views[0]
      selectedViewId.value = defaultView?.id || null
    }
  }
  selectedRecordId.value = recordId
}

function handleCloseRecord() {
  selectedRecordId.value = null
}

function handleBack() {
  emit('back')
}

function getTableIcon(iconName: string | undefined): string {
  const icons: Record<string, string> = {
    'building': '🏢',
    'user': '👤',
    'file-text': '📄',
    'list': '📋',
    'file-signature': '✍️',
    'database': '📊',
    'chart-bar': '📈'
  }
  return icons[iconName || 'database'] || '📊'
}

function getViewIcon(viewType: View['type']): string {
  const icons: Record<View['type'], string> = {
    'table': '📋',
    'kanban': '📌',
    'gantt': '📊',
    'calendar': '📅',
    'gallery': '🖼️'
  }
  return icons[viewType] || '📋'
}

// ============ Add View Dialog ============
const showAddViewDialog = ref(false)
const addViewTableId = ref<string | null>(null)

// Get columns for the table we're adding a view to
const addViewTableColumns = computed(() => {
  if (!addViewTableId.value || !currentDb.value) return []
  const table = currentDb.value.tables.find(t => t.id === addViewTableId.value)
  return table?.columns || []
})

function handleOpenAddView(tableId: string) {
  addViewTableId.value = tableId
  showAddViewDialog.value = true
}

function handleCreateView(data: {
  name: string
  type: ViewType
  groupByField?: string
  startDateField?: string
  endDateField?: string
  dateField?: string
  titleField?: string
}) {
  if (!addViewTableId.value || !data.name) return
  
  // Get the useTable composable for the target table
  const { createView } = useTable(props.database.id, addViewTableId.value)
  
  // Build view config based on type
  const config: ViewConfig = {}
  
  switch (data.type) {
    case 'kanban':
      if (data.groupByField) {
        config.groupByField = data.groupByField
      }
      break
    case 'gantt':
      if (data.startDateField) {
        config.startDateField = data.startDateField
      }
      if (data.endDateField) {
        config.endDateField = data.endDateField
      }
      if (data.titleField) {
        config.titleField = data.titleField
      }
      break
    case 'calendar':
      if (data.dateField) {
        config.dateField = data.dateField
      }
      break
    case 'gallery':
      if (data.titleField) {
        config.titleField = data.titleField
      }
      break
  }
  
  const newView = createView({
    name: data.name,
    type: data.type,
    config
  })
  
  if (newView) {
    // Select the new view
    selectedTableId.value = addViewTableId.value
    selectedViewId.value = newView.id
    selectedType.value = 'table'
    
    // Expand My Views section
    sectionsCollapsed.value.myViews = false
    }
}

// ============ Delete View ============
function handleDeleteView(table: Table, view: View, event: Event) {
  event.stopPropagation()
  
  if (table.views.length <= 1) {
    alert('Cannot delete the last view')
    return
  }
  
  if (!confirm(`Delete view "${view.name}"?`)) return
  
  const { deleteView } = useTable(props.database.id, table.id)
  const deleted = deleteView(view.id)
  
  if (deleted && selectedViewId.value === view.id) {
    // Select first available view
    const firstView = table.views.find(v => v.id !== view.id)
    if (firstView) {
      selectedViewId.value = firstView.id
    }
  }
}

// ============ Edit View Dialog ============
const showEditViewDialog = ref(false)
const editViewTableId = ref<string | null>(null)
const editViewId = ref<string | null>(null)

// Get the view being edited
const editingView = computed(() => {
  if (!editViewTableId.value || !editViewId.value || !currentDb.value) return null
  const table = currentDb.value.tables.find(t => t.id === editViewTableId.value)
  return table?.views.find(v => v.id === editViewId.value) || null
})

// Get columns for the table we're editing a view for
const editViewTableColumns = computed(() => {
  if (!editViewTableId.value || !currentDb.value) return []
  const table = currentDb.value.tables.find(t => t.id === editViewTableId.value)
  return table?.columns || []
})

function handleOpenEditView(table: Table, view: View, event: Event) {
  event.stopPropagation()
  editViewTableId.value = table.id
  editViewId.value = view.id
  showEditViewDialog.value = true
}

function handleSaveEditView(data: {
  name: string
  isDefault: boolean
  groupByField?: string
  startDateField?: string
  endDateField?: string
  dateField?: string
  titleField?: string
}) {
  if (!editViewTableId.value || !editViewId.value || !data.name) return
  
  const { updateView } = useTable(props.database.id, editViewTableId.value)
  
  // Build view config based on type
  const config: ViewConfig = {}
  const viewType = editingView.value?.type
  
  switch (viewType) {
    case 'kanban':
      if (data.groupByField) {
        config.groupByField = data.groupByField
      }
      break
    case 'gantt':
      if (data.startDateField) {
        config.startDateField = data.startDateField
      }
      if (data.endDateField) {
        config.endDateField = data.endDateField
      }
      if (data.titleField) {
        config.titleField = data.titleField
      }
      break
    case 'calendar':
      if (data.dateField) {
        config.dateField = data.dateField
      }
      break
    case 'gallery':
      if (data.titleField) {
        config.titleField = data.titleField
      }
      break
  }
  
  // Update the view
  updateView(editViewId.value, {
    name: data.name,
    isDefault: data.isDefault,
    config
  })
  
  // If set as default, unset other views
  if (data.isDefault && currentDb.value) {
    const table = currentDb.value.tables.find(t => t.id === editViewTableId.value)
    if (table) {
      for (const v of table.views) {
        if (v.id !== editViewId.value && v.isDefault) {
          updateView(v.id, { isDefault: false })
        }
      }
    }
  }
}

// ============ Add Table Dialog ============
const showAddTableDialog = ref(false)
const newTableForm = ref<{
  name: string
  description: string
  icon: string
}>({
  name: '',
  description: '',
  icon: 'database'
})

const tableIconOptions = [
  { value: 'database', label: '📊' },
  { value: 'building', label: '🏢' },
  { value: 'user', label: '👤' },
  { value: 'file-text', label: '📄' },
  { value: 'list', label: '📋' },
  { value: 'file-signature', label: '✍️' },
  { value: 'chart-bar', label: '📈' },
  { value: 'calendar', label: '📅' },
  { value: 'folder', label: '📁' },
  { value: 'star', label: '⭐' }
]

function handleOpenAddTable() {
  newTableForm.value = {
    name: '',
    description: '',
    icon: 'database'
  }
  showAddTableDialog.value = true
}

function handleCreateTable() {
  if (!newTableForm.value.name) return
  
  const { createTable } = useDatabase()
  
  const newTable = createTable(props.database.id, {
    name: newTableForm.value.name,
    description: newTableForm.value.description,
    icon: newTableForm.value.icon
  })
  
  if (newTable) {
    // Select the new table and its default view
    selectedTableId.value = newTable.id
    selectedViewId.value = newTable.views[0]?.id || null
    selectedType.value = 'table'
    
    // Expand tables section
    sectionsCollapsed.value.tables = false
  }
  
  showAddTableDialog.value = false
}

// ============ Delete Table ============
function handleDeleteTable(table: Table, event: Event) {
  event.stopPropagation()
  
  if (!confirm(`Delete table "${table.name}" and all its data? This cannot be undone.`)) return
  
  const { deleteTable } = useDatabase()
  const deleted = deleteTable(props.database.id, table.id)
  
  if (deleted && selectedTableId.value === table.id) {
    // Select first available table
    const firstTable = currentDb.value?.tables.find(t => t.id !== table.id)
    if (firstTable) {
      selectedTableId.value = firstTable.id
      selectedViewId.value = firstTable.views[0]?.id || null
    } else {
      selectedTableId.value = null
      selectedViewId.value = null
    }
  }
}

// ============ Create Personal View Dialog ============
const showCreatePersonalViewDialog = ref(false)

function handleOpenCreatePersonalView() {
  showCreatePersonalViewDialog.value = true
}

function handleCreatePersonalView(data: { name: string; tableId: string; type: ViewType }) {
  // Get the table and create view using useView composable
  const table = currentDb.value?.tables.find(t => t.id === data.tableId)
  if (!table) return
  
  // Use useTable to create the view
  const { createView } = useTable(props.database.id, data.tableId)
  
  const now = new Date().toISOString()
  const newView = createView({
    name: data.name,
    type: data.type,
    isDefault: false,
    createdBy: 'user-1', // Current user
    visibility: 'personal',
    baseTableId: data.tableId,
    createdAt: now,
    updatedAt: now,
    config: {}
  })
  
  if (newView) {
    // Add to navigation if created from folder menu
    if (createViewParentId.value !== null) {
      addNavigationItem(props.database.id, createViewParentId.value, 'view', {
        label: data.name,
        targetId: newView.id,
        targetTableId: data.tableId,
        icon: 'postcard'
      })
      createViewParentId.value = null // Reset
    }
    
    // Select the new view
    selectedTableId.value = data.tableId
    selectedViewId.value = newView.id
    selectedType.value = 'table'
    
    // Expand My Views section
    sectionsCollapsed.value.myViews = false
    
    ElMessage.success(`View "${data.name}" created successfully`)
  }
}

// Get visibility badge color
function getVisibilityBadge(view: View): { text: string; type: 'info' | 'success' | 'warning' } {
  if (view.visibility === 'shared' && view.sharedWith?.length) {
    return { text: 'Shared', type: 'success' }
  }
  return { text: 'Personal', type: 'info' }
}

// ============ ViewPage Handlers ============
function handleBackFromViewPage() {
  // Go back to default view of the table
  if (selectedTable.value) {
    const defaultView = selectedTable.value.views.find(v => v.isDefault) || selectedTable.value.views[0]
    if (defaultView) {
      selectedViewId.value = defaultView.id
    }
  }
}

function handleViewDeleted(viewId: string) {
  // View was deleted, switch to default view
  if (selectedTable.value) {
    const defaultView = selectedTable.value.views.find(v => v.isDefault) || selectedTable.value.views[0]
    if (defaultView) {
      selectedViewId.value = defaultView.id
    }
  }
}

function handleViewUpdated(view: View) {
  // View was updated, just refresh the sidebar
  // The reactive state should handle this automatically
}

// ============ Export Functions ============
function handleExportDatabase() {
  if (!currentDb.value) return
  exportAndDownloadDatabase(props.database.id, `crm-database.json`)
  ElMessage.success('Database exported successfully')
}

function handleExportAllData() {
  exportAndDownloadAllData()
  ElMessage.success('All data exported successfully (database + users)')
}
</script>

<template>
  <div class="database-detail">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <el-button
          class="back-btn"
          size="small"
          :icon="ArrowLeft"
          type="text"
          @click="handleBack"
        >
        </el-button>
        <div v-if="!sidebarCollapsed" class="db-info">
          <div class="db-icon" :style="{ backgroundColor: currentDb?.color }">
          </div>
          <span class="db-name">{{ currentDb?.name }}</span>
        </div>
        <el-dropdown v-if="!sidebarCollapsed" trigger="click" @command="(cmd: string) => cmd === 'database' ? handleExportDatabase() : handleExportAllData()">
          <el-button
            class="export-btn"
            text
            size="small"
            :icon="Download"
            title="Export Data"
          />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="database">
                <el-icon><Download /></el-icon>
                Export Database
              </el-dropdown-item>
              <el-dropdown-item command="all">
                <el-icon><Download /></el-icon>
                Export All (DB + Users)
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          class="collapse-btn"
          text
          size="small"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          {{ sidebarCollapsed ? '→' : '←' }}
        </el-button>
      </div>

      <nav class="sidebar-nav">
        <!-- Custom Navigation Tree -->
        <NavigationTree
          v-if="currentDb && !sidebarCollapsed"
          :database="currentDb"
          :active-item-id="activeNavItemId"
          :active-item-type="activeNavItemType"
          @select-table="handleNavSelectTable"
          @select-view="handleNavSelectView"
          @select-dashboard="handleNavSelectDashboard"
          @select-folder="handleNavSelectFolder"
          @toggle-folder="handleNavToggleFolder"
          @add-item="handleNavAddItem"
          @update-navigation="handleNavUpdateNavigation"
        />
        
        <!-- Collapsed state icons -->
        <div v-if="sidebarCollapsed" class="collapsed-nav">
          <div
            v-for="table in currentDb?.tables"
            :key="table.id"
            class="collapsed-nav-item"
            :class="{ active: selectedTableId === table.id && selectedType === 'table' }"
            :title="table.name"
            @click="handleNavSelectTable(table.id)"
          >
            <el-icon :size="18"><Grid /></el-icon>
                </div>
              </div>
      </nav>
          <div
            class="nav-item"
            :class="{ active: selectedType === 'settings' }"
            @click="selectedType = 'settings'"
          >
            <span v-if="!sidebarCollapsed" class="nav-label">Settings</span>
          </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Record Detail View (360 View) -->
      <template v-if="selectedRecordId && selectedTable">
        <RecordDetailWithLayout
          v-if="selectedTable.detailViewLayout"
          :database="props.database"
          :table="selectedTable"
          :record-id="selectedRecordId"
          @close="handleCloseRecord"
        />
        <RecordDetailView
          v-else
          :database="props.database"
          :table="selectedTable"
          :record-id="selectedRecordId"
          @close="handleCloseRecord"
          @open-record="handleOpenRecord"
        />
      </template>
      
      <!-- Personal View (with ViewPage toolbar) -->
      <template v-else-if="selectedType === 'table' && selectedTable && selectedView && isPersonalView">
        <ViewPage
          :key="`viewpage-${selectedTable.id}-${selectedView.id}`"
          :database="props.database"
          :table="selectedTable"
          :view="selectedView"
          @back="handleBackFromViewPage"
          @open-record="handleOpenRecord"
          @view-deleted="handleViewDeleted"
          @view-updated="handleViewUpdated"
        />
      </template>
      
      <!-- Default Table/View -->
      <template v-else-if="selectedType === 'table' && selectedTable && selectedView">
        <ViewRenderer
          :key="`${selectedTable.id}-${selectedView.id}`"
          :database="props.database"
          :table="selectedTable"
          :view="selectedView"
          @open-record="handleOpenRecord"
          @view-created="handleViewCreated"
          @open-table-settings="handleOpenTableSettings"
        />
      </template>
      
      <!-- Table Settings Page -->
      <template v-else-if="selectedType === 'table-settings' && selectedTable">
        <TableSettingsPage
          :database="props.database"
          :table="selectedTable"
          @back="handleBackFromTableSettings"
          @updated="() => {}"
        />
      </template>
      
      <!-- Dashboard -->
      <template v-else-if="selectedType === 'dashboard' && selectedDashboard">
        <DashboardView
          :database="props.database"
          :dashboard="selectedDashboard"
        />
      </template>
      
      <!-- Folder View -->
      <template v-else-if="selectedType === 'folder' && selectedFolder">
        <FolderView
          :folder="selectedFolder"
          :database="props.database"
          @select-table="handleNavSelectTable"
          @select-view="handleNavSelectView"
          @select-dashboard="handleNavSelectDashboard"
          @select-folder="handleSelectFolder"
        />
      </template>
      
      <!-- Settings -->
      <template v-else-if="selectedType === 'settings'">
        <DatabaseSettings :database="props.database" />
      </template>
    </main>

    <!-- Add View Dialog -->
    <AddViewDialog
      v-model="showAddViewDialog"
      :columns="addViewTableColumns"
      @create="handleCreateView"
    />

    <!-- Edit View Dialog -->
    <EditViewDialog
      v-model="showEditViewDialog"
      :view="editingView"
      :columns="editViewTableColumns"
      @save="handleSaveEditView"
    />

    <!-- Add Table Dialog -->
    <el-dialog
      v-model="showAddTableDialog"
      title="Add New Table"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Table Name" required>
          <el-input
            v-model="newTableForm.name"
            placeholder="Enter table name"
          />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="newTableForm.description"
            type="textarea"
            :rows="2"
            placeholder="Optional description"
          />
        </el-form-item>

        <el-form-item label="Icon">
          <el-radio-group v-model="newTableForm.icon" class="icon-group">
            <el-radio-button
              v-for="icon in tableIconOptions"
              :key="icon.value"
              :value="icon.value"
            >
              {{ icon.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddTableDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="!newTableForm.name"
          @click="handleCreateTable"
        >
          Create Table
        </el-button>
      </template>
    </el-dialog>

    <!-- Create Personal View Dialog -->
    <CreatePersonalViewDialog
      v-model="showCreatePersonalViewDialog"
      :tables="currentDb?.tables || []"
      @create="handleCreatePersonalView"
    />
  </div>
</template>

<style lang="scss" scoped>
.database-detail {
  display: flex;
  height: 100%;
  background: var(--app-bg-color-page);
}

.sidebar {
  width: 280px;
  background: var(--app-paper);
  border-right: 1px solid var(--app-border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;

  &.collapsed {
    width: 60px;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  border-bottom: 1px solid var(--app-border-color);
}

.back-btn {
  flex-shrink: 0;
}

.db-info {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  flex: 1;
  min-width: 0;
}

.db-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--app-border-radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--app-font-size-s);
  flex-shrink: 0;
}

.db-name {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  flex-shrink: 0;
}

.export-btn {
  flex-shrink: 0;
  color: var(--app-text-color-secondary);
  
  &:hover {
    color: var(--app-primary-color);
  }
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s) var(--app-space-xs);
}

.nav-section {
  margin-bottom: var(--app-space-xs);
}

.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-xs) var(--app-space-s);
  margin-bottom: var(--app-space-xs);
  
  &.collapsible {
    cursor: pointer;
    border-radius: var(--app-border-radius-s);
    transition: background 0.15s ease;
    
    &:hover {
      background: var(--app-fill-color);
    }
  }
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.expand-icon {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
  transition: transform 0.2s ease;
}

.nav-section-title {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--app-text-color-placeholder);
}

.add-btn {
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-placeholder);
  padding: 2px 6px;
  
  &:hover {
    color: var(--app-primary-color);
  }
}

.section-content {
  margin-left: var(--app-space-xs);
}

.empty-section {
  padding: var(--app-space-s);
  text-align: center;
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  font-style: italic;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  color: var(--app-text-color-secondary);
  transition: all 0.15s ease;
  user-select: none;

  &:hover {
    background: var(--app-fill-color);
    color: var(--app-text-color-primary);

    .delete-view-btn {
      opacity: 1;
    }
  }

  &.active {
    background: var(--app-primary-alpha-10);
    color: var(--app-primary-color);
    font-weight: 700;
  }
}

.table-item {
  font-weight: 500;
  justify-content: space-between;
  
  .delete-table-btn {
    opacity: 0;
    padding: 2px 4px;
    font-size: var(--app-font-size-xs);
    transition: opacity 0.15s ease;
    
    &:hover {
      color: var(--app-danger-color);
    }
  }
  
  &:hover .delete-table-btn {
    opacity: 1;
  }
}

.view-item {
  font-size: var(--app-font-size-s);
  padding: var(--app-space-xxs) var(--app-space-s);
  justify-content: space-between;
  width: 100%;

  .view-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .nav-label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .view-tags {
    display: flex;
    align-items: center;
    gap: var(--app-space-xxs);
  }

  .table-tag {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--app-fill-color);
    border-radius: var(--app-border-radius-xs);
    color: var(--app-text-color-placeholder);
  }

  .visibility-tag {
    font-size: 9px;
    padding: 0 4px;
    height: 16px;
    line-height: 16px;
  }

  .default-badge {
    color: var(--app-warning-color);
    font-size: var(--app-font-size-xs);
  }

  .view-actions {
    display: flex;
    gap: 0px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover .view-actions {
    opacity: 1;
  }

  .edit-view-btn,
  .delete-view-btn {
    padding: 2px 4px;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-placeholder);

    &:hover {
      color: var(--app-primary-color);
    }
  }

  .delete-view-btn:hover {
    color: var(--app-danger-color);
  }
}

.nav-icon {
  font-size: var(--app-font-size-m);
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  font-size: var(--app-font-size-m);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapsed-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
}

.collapsed-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  color: var(--app-text-color-secondary);
  transition: all 0.15s ease;
  
  &:hover {
    background: var(--app-fill-color);
    color: var(--app-text-color-primary);
  }
  
  &.active {
    background: var(--app-primary-alpha-10);
    color: var(--app-primary-color);
  }
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.placeholder-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--app-text-color-secondary);

  .placeholder-icon {
    font-size: 64px;
    margin-bottom: var(--app-space-s);
    opacity: 0.5;
  }

  h2 {
    font-size: var(--app-font-size-xl);
    font-weight: 600;
    color: var(--app-text-color-primary);
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    font-size: var(--app-font-size-m);
    margin: 0;
  }
}

.icon-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  
  :deep(.el-radio-button__inner) {
    border-radius: var(--app-border-radius-s) !important;
    border-left-width: 1px !important;
    padding: 8px 12px;
    font-size: var(--app-font-size-l);
  }
}
</style>
