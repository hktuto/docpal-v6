<script setup lang="ts">
import type { DatabaseItem } from '../../../utils/databaseType'
import { useDatabases } from '../../../composables/useDatabases'
import { VirtGrid } from 'vue-virt-list'
import { ElMessageBox, ElMessage } from 'element-plus'

const createWorkspacePopover = ref()
const viewMode = ref<'grid' | 'table'>('grid')

// Use workspaces composable
const { databases, loading, getDatabases,  deleteDatabase } = useDatabases()

// Grid container ref and responsive columns
const gridContainerRef = ref<HTMLElement>()
const { columnCount, columnWidthPerScreen } = useGridColumns(gridContainerRef, {
  minColumnWidth: 260,
  minColumns: 1,
  maxColumns: 6,
  gap: 16
})

// Refs for scrolling
const virtGridRef = ref()
const tableRef = ref()


const routerProvider = inject(MenuRouterKey)

// Provide search handler to SearchableList (returns filtered results)
provide('onSearchParamsChange', null)


function handleCreateWorkspace(e: MouseEvent) {
  createWorkspacePopover.value.open(e.currentTarget as HTMLElement)
}

function handleCreateWorkspaceSuccess(workspace: any) {
  getDatabases()
  createWorkspacePopover.value.close()
  const newItem = {
    id: 'workspace-detail',
    name: 'workspace-detail',
    icon: 'lucide:grid-3x2',
    label: 'Workspace Detail',
    component: 'LazyWorkspacesDetail',
    props: {
      id: workspace.id
    }
  }
  routerProvider?.navigateTo(newItem)
}

function handleWorkspaceSelected(workspace: DatabaseItem) {
  const newItem = {
    id: 'workspace-detail',
    name: 'workspace-detail',
    icon: 'lucide:grid-3x2',
    label: 'Workspace Detail',
    component: 'LazyDatabaseDetail',
    props: {
      id: workspace.id
    }
  }
  routerProvider?.navigateTo(newItem)
  // Handle workspace selection (e.g., navigate to workspace)
}

async function handleWorkspaceDelete(workspace: DatabaseItem) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${workspace.name}"?<br><br>This will permanently delete the workspace and all related data. This action cannot be undone.`,
      'Delete Workspace',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )

    const success = await deleteDatabase(workspace.id)
    if(success) {
      ElMessage.success(`${workspace.name} deleted successfully`)
    } else {
      ElMessage.error(`Failed to delete ${workspace.name}`)
    }
    // Workspace list will be automatically refreshed by deleteDatabase
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('Failed to delete workspace:', error)
      // You might want to show an error message to the user here
    }
    // User cancelled the deletion - do nothing
  }
}


function handleFiltered() {
  // Scroll to top when filters are applied
  nextTick(() => {
    if (viewMode.value === 'grid' && virtGridRef.value) {
      // Scroll VirtGrid to top
      virtGridRef.value.scrollToIndex(0)
    } else if (viewMode.value === 'table' && tableRef.value) {
      // Scroll table to top
      tableRef.value.scrollToTop?.()
    }
  })
}

onMounted(() => {
  getDatabases()
})
</script>

<template>
  <div class="pageContainer">
    <div class="pageHeader">
      <h1 class="title">Databases</h1>
      <div class="actions">
        <ElButton type="primary" @click="handleCreateWorkspace">Create Databases ({{ databases.length }})</ElButton>
      </div>
    </div>
    <div class="workspaceList">
      <UiSearchableList
        v-loading="loading"
        :data="databases"
        :search-keys="['name', 'description']"
        :default-sort-by="'name'"
        :default-sort-order="'asc'"
        @selected="handleWorkspaceSelected"
        @filtered="handleFiltered"
      >
        <template #actions>
          <!-- Toggle table/grid view -->
          <div class="action-button" @click="viewMode = viewMode === 'grid' ? 'table' : 'grid'">
            <Icon :name="viewMode === 'grid' ? 'lucide:grid-3x2' : 'lucide:table'" />
          </div>
        </template>
        <template #default="{ items, keyword }">
          <template v-if="viewMode === 'grid'">
            <div ref="gridContainerRef" style="height: 100%; width: 100%">
              <VirtGrid ref="virtGridRef" :list="items" :buffer="10" :gridItems="columnCount" :style="`--list-card-width:${columnWidthPerScreen}`">
                <template #default="{ itemData, index, rowIndex }">
                  <DatabaseListCard :workspace="itemData" :keyword="keyword" @selected="handleWorkspaceSelected" @delete="handleWorkspaceDelete" />
                </template>
              </VirtGrid>
            </div>
          </template>
          <template v-if="viewMode === 'table'">
            <DatabaseListTable ref="tableRef" :items="items" :keyword="keyword" @selected="handleWorkspaceSelected" @delete="handleWorkspaceDelete" />
          </template>
        </template>
      </UiSearchableList>
    </div>
  </div>
  <UiPopoverDialog ref="createWorkspacePopover" title="Create Workspace">
    <DatabaseCreateForm @created="handleCreateWorkspaceSuccess" />
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}
.searchable-list {
  height: 100%;
}
:deep(.cardGridContainer) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--app-space-s);
}
.pageHeader {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs) var(--app-space-s);
  .title {
    flex: 1 0 auto;
    line-height: 1;
  }
}
.workspaceList {
  padding: var(--app-space-xs) var(--app-space-s);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  height: 100%;
  overflow: hidden;
  position: relative;
}
.action-button {
  display: flex;
  background: var(--app-grey-800);
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-m);
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-m);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-radius: var(--app-border-radius-s);
    background: var(--app-text-color);
  }

  &.db-search-active {
    background: var(--app-primary-color);
    color: var(--app-paper);
  }
}
</style>
