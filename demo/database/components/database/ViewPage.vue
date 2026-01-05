<script lang="ts" setup>
import type { Database, Table, View, ViewType } from '../../types/database'
import { useView } from '../../composables/useView'
import ViewRenderer from './ViewRenderer.vue'
import ViewSettingsDrawer from './ViewSettingsDrawer.vue'
import UnifiedHeader from './UnifiedHeader.vue'
import type { BreadcrumbItem, HeaderAction } from './UnifiedHeader.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  database: Database
  table: Table
  view: View
}>()

const emit = defineEmits<{
  back: []
  openRecord: [tableId: string, recordId: string]
  viewDeleted: [viewId: string]
  viewUpdated: [view: View]
}>()

// Initialize useView composable
const {
  view: currentView,
  hasUnsavedChanges,
  visibleColumns,
  filters,
  sorting,
  resolveVisibleColumns,
  updateViewType,
  updateViewName,
  updateViewConfig,
  updateViewColumns,
  addFilter,
  clearFilters,
  addSort,
  clearSorting,
  getRelatedTables,
  saveView,
  duplicateView,
  deleteView
} = useView(props.database.id, props.table.id, props.view.id)

// Settings drawer state
const showSettingsDrawer = ref(false)

// Store original state for reverting preview
const originalViewState = ref<{
  name: string
  type: ViewType
  config: any
  filters: any[]
  sorting: any[]
  columns: any[]
} | null>(null)

// Preview mode active
const isPreviewActive = ref(false)

// Open settings drawer
function handleOpenSettings() {
  // Store original state before opening drawer
  originalViewState.value = {
    name: currentView.value?.name || props.view.name,
    type: currentView.value?.type || props.view.type,
    config: JSON.parse(JSON.stringify(currentView.value?.config || props.view.config || {})),
    filters: JSON.parse(JSON.stringify(filters.value)),
    sorting: JSON.parse(JSON.stringify(sorting.value)),
    columns: JSON.parse(JSON.stringify(visibleColumns.value))
  }
  isPreviewActive.value = false
  showSettingsDrawer.value = true
}

// Handle settings save from drawer
function handleSettingsSave(settings: {
  name: string
  type: ViewType
  config: any
  filters: any[]
  sorting: any[]
  columns: any[]
}) {
  // Apply all settings to the view
  updateViewName(settings.name)
  updateViewType(settings.type)
  updateViewConfig(settings.config)
  
  // Clear and re-apply filters
  clearFilters()
  for (const filter of settings.filters) {
    addFilter(filter)
  }
  
  // Clear and re-apply sorting
  clearSorting()
  for (const sort of settings.sorting) {
    addSort(sort)
  }
  
  // Update columns
  updateViewColumns(settings.columns)
  
  // Clear stored state
  isPreviewActive.value = false
  originalViewState.value = null
  
  emit('viewUpdated', currentView.value!)
  ElMessage.success('View settings saved')
}

// Handle settings preview from drawer
function handleSettingsPreview(settings: {
  name: string
  type: ViewType
  config: any
  filters: any[]
  sorting: any[]
  columns: any[]
}) {
  isPreviewActive.value = true
  
  // Apply settings temporarily for preview
  updateViewName(settings.name)
  updateViewType(settings.type)
  updateViewConfig(settings.config)
  
  // Clear and re-apply filters
  clearFilters()
  for (const filter of settings.filters) {
    addFilter(filter)
  }
  
  // Clear and re-apply sorting
  clearSorting()
  for (const sort of settings.sorting) {
    addSort(sort)
  }
  
  // Update columns
  updateViewColumns(settings.columns)
  
  ElMessage.info('Preview applied - Save or Cancel to confirm')
}

// Handle settings cancel from drawer
function handleSettingsCancel() {
  // If we were previewing, revert to original state
  if (isPreviewActive.value && originalViewState.value) {
    updateViewName(originalViewState.value.name)
    updateViewType(originalViewState.value.type)
    updateViewConfig(originalViewState.value.config)
    
    // Restore filters
    clearFilters()
    for (const filter of originalViewState.value.filters) {
      addFilter(filter)
    }
    
    // Restore sorting
    clearSorting()
    for (const sort of originalViewState.value.sorting) {
      addSort(sort)
    }
    
    // Restore columns
    updateViewColumns(originalViewState.value.columns)
    
    ElMessage.info('Changes discarded')
  }
  
  isPreviewActive.value = false
  originalViewState.value = null
}

// Resolved columns for rendering
const resolvedColumns = computed(() => resolveVisibleColumns())

// Generate a key for forcing view re-render when columns/config change
const viewRenderKey = computed(() => {
  const cols = visibleColumns.value
    .filter(c => c.visible)
    .map(c => `${c.id}:${c.order}`)
    .join('|')
  const filterCount = filters.value.length
  const sortCount = sorting.value.length
  return `${props.table.id}-${props.view.id}-${cols}-f${filterCount}-s${sortCount}`
})

// Handle save
function handleSave() {
  saveView()
  ElMessage.success('View saved successfully')
}

// Handle duplicate
function handleDuplicate() {
  const newView = duplicateView(props.view.id, `${props.view.name} (Copy)`)
  if (newView) {
    ElMessage.success('View duplicated successfully')
  }
}

// Handle delete
function handleDelete() {
  ElMessageBox.confirm(
    `Are you sure you want to delete "${props.view.name}"?`,
    'Delete View',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  ).then(() => {
    const deleted = deleteView(props.view.id)
    if (deleted) {
      emit('viewDeleted', props.view.id)
      ElMessage.success('View deleted successfully')
    }
  }).catch(() => {
    // Cancelled
  })
}

// Handle share (placeholder for now)
function handleShare() {
  ElMessage.info('Share functionality coming soon')
}

// Handle back
function handleBack() {
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm(
      'You have unsaved changes. Do you want to save before leaving?',
      'Unsaved Changes',
      {
        confirmButtonText: 'Save',
        cancelButtonText: 'Discard',
        distinguishCancelAndClose: true,
        type: 'warning'
      }
    ).then(() => {
      saveView()
      emit('back')
    }).catch((action) => {
      if (action === 'cancel') {
        emit('back')
      }
    })
  } else {
    emit('back')
  }
}

// Handle record open
function handleOpenRecord(tableId: string, recordId: string) {
  emit('openRecord', tableId, recordId)
}

// Breadcrumb for UnifiedHeader
const breadcrumb = computed<BreadcrumbItem[]>(() => [
  {
    label: props.database.name,
    to: handleBack
  },
  {
    label: props.table.name,
    to: handleBack
  },
  {
    label: currentView.value?.name || props.view.name
  }
])

function handleExportSettings() {
  console.log('view', props.view)
}

// Header actions for UnifiedHeader
const headerActions = computed<HeaderAction[]>(() => [
  {
    code: 'save',
    label: hasUnsavedChanges.value ? 'Save Changes' : 'Save',
    disabled: !hasUnsavedChanges.value,
    action: handleSave
  },
  {
    code:'exportSettings',
    label: 'Export Settings',
    action: handleExportSettings
  },
  {
    code: 'settings',
    label: 'View Settings',
    divided: true,
    action: handleOpenSettings
  },
  {
    code: 'share',
    label: 'Share',
    action: handleShare
  },
  {
    code: 'duplicate',
    label: 'Duplicate',
    divided: true,
    action: handleDuplicate
  },
  {
    code: 'delete',
    label: 'Delete',
    danger: true,
    disabled: props.view.isDefault,
    action: handleDelete
  }
])
</script>

<template>
  <div class="view-page">
    <!-- Unified Header -->
    <UnifiedHeader
      :breadcrumb="breadcrumb"
      :context="{
        type: 'view',
        database: props.database,
        table: props.table,
        view: currentView || props.view
      }"
      :actions="headerActions"
      :show-collaborators="true"
    />
    
    <!-- View Content -->
    <main class="view-content">
      <ViewRenderer
        :key="viewRenderKey"
        :database="database"
        :table="table"
        :view="currentView || view"
        :resolved-columns="resolvedColumns"
        hide-header
        @open-record="handleOpenRecord"
      />
    </main>
    
    <!-- Settings Drawer -->
    <ViewSettingsDrawer
      v-model="showSettingsDrawer"
      :table="table"
      :view="currentView || view"
      :visible-columns="visibleColumns"
      :filters="filters"
      :sorting="sorting"
      :related-tables="getRelatedTables()"
      @save="handleSettingsSave"
      @preview="handleSettingsPreview"
      @cancel="handleSettingsCancel"
    />
  </div>
</template>

<style lang="scss" scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--app-bg-color-page);
}

.view-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>

