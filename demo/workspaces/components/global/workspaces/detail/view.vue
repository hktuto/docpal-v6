<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CaseViewRecord, ViewType } from '../../../../utils/db/schema/newTableSchema'

const { workspaceRouteParams, workspace, menuState, findItemById, deleteItem, navigateToItem } = useSingleWorkspaceContext()

const currentMenuItem = ref<any>(null)
const currentView = ref<CaseViewRecord | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Use tableView composable for data management
const tableView = useTableView()
const viewReady = ref(false)

// Lazy-loaded view components
const TableViewComponent = defineAsyncComponent(() => import('../views/TableView.vue'))
const KanbanViewComponent = defineAsyncComponent(() => import('../views/KanbanView.vue'))
const GanttViewComponent = defineAsyncComponent(() => import('../views/GanttView.vue'))
const CalendarViewComponent = defineAsyncComponent(() => import('../views/CalendarView.vue'))

function getCurrentMenuItem() {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
}

function checkMenuItemStatus() {
  const menuItem = getCurrentMenuItem()
  currentMenuItem.value = menuItem
}

// Get the component based on view type
const viewComponent = computed(() => {
  if (!currentView.value) return null

  switch (currentView.value.viewType) {
    case 'kanban':
      return KanbanViewComponent
    case 'gantt':
      return GanttViewComponent
    case 'calendar':
      return CalendarViewComponent
    case 'table':
    default:
      return TableViewComponent
  }
})

// Get view type icon
const viewTypeIcon = computed(() => {
  if (!currentView.value) return 'material-symbols:view-list-outline'

  switch (currentView.value.viewType) {
    case 'kanban':
      return 'material-symbols:view-kanban-outline'
    case 'gantt':
      return 'material-symbols:view-timeline-outline'
    case 'calendar':
      return 'material-symbols:calendar-month-outline'
    case 'table':
    default:
      return 'material-symbols:table-outline'
  }
})

async function loadViewData() {
  if (!currentMenuItem.value?.itemId) return

  isLoading.value = true
  error.value = null
  viewReady.value = false

  try {
    // Initialize by view ID
    await tableView.initializeByView(currentMenuItem.value.itemId)
    currentView.value = tableView.currentView.value
    viewReady.value = true
  } catch (err) {
    console.error('Error loading view:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load view'
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteView() {
  if (!currentMenuItem.value) return

  try {
    await ElMessageBox.confirm('This will delete this view. The underlying table data will not be affected.', 'Delete View', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })

    await deleteItem(currentMenuItem.value.id)
    navigateToItem() // Navigate to root
    ElMessage.success('View deleted successfully')
  } catch (e) {
    // User cancelled
  }
}

onMounted(() => {
  checkMenuItemStatus()
  if (currentMenuItem.value) {
    loadViewData()
  }
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    checkMenuItemStatus()
    if (currentMenuItem.value) {
      loadViewData()
    }
  }
)
</script>

<template>
  <div class="view-detail-container">
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="loading-state">
        <el-icon class="is-loading">
          <Icon name="material-symbols:progress-activity" />
        </el-icon>
        <span>Loading view...</span>
      </div>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <div class="error-state">
        <Icon name="material-symbols:error-outline" class="error-icon" />
        <h3>View Not Found</h3>
        <p>{{ error }}</p>
        <el-button type="danger" @click="handleDeleteView"> Delete and try again </el-button>
      </div>
    </template>

    <!-- Menu item not found -->
    <template v-else-if="!currentMenuItem">
      <div class="error-state">
        <Icon name="material-symbols:error-outline" class="error-icon" />
        <h3>View Not Found</h3>
        <p>The requested view could not be found.</p>
      </div>
    </template>

    <!-- View not properly created -->
    <template v-else-if="!currentMenuItem.itemId">
      <div class="error-state">
        <Icon name="material-symbols:error-outline" class="error-icon" />
        <h3>View Not Configured</h3>
        <p>This view was not created properly.</p>
        <el-button type="danger" @click="handleDeleteView"> Delete and try again </el-button>
      </div>
    </template>

    <!-- View Content -->
    <template v-else-if="viewReady && currentView">
      <div class="view-content">
        <!-- View Type Badge -->
        <div class="view-info">
          <el-tag type="info" size="small">
            <Icon :name="viewTypeIcon" />
            {{ currentView.viewType?.charAt(0).toUpperCase() + currentView.viewType?.slice(1) }} View
          </el-tag>
        </div>

        <!-- Dynamic View Component -->
        <Suspense>
          <template #default>
            <component :is="viewComponent" :view="currentView" :table-view="tableView" />
          </template>
          <template #fallback>
            <div class="loading-state">
              <el-icon class="is-loading">
                <Icon name="material-symbols:progress-activity" />
              </el-icon>
              <span>Loading {{ currentView.viewType }} view...</span>
            </div>
          </template>
        </Suspense>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 32px;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-secondary);
  text-align: center;

  .error-icon {
    font-size: 64px;
    color: var(--el-color-danger);
  }

  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
  }
}

.view-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-info {
  padding: var(--app-space-s) var(--app-space-m);
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  flex-shrink: 0;

  .el-tag {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);

    .iconify {
      font-size: 14px;
    }
  }
}
</style>
