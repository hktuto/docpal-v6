<script setup lang="ts">
import type { CaseTypeRecord } from '../../utils/db/schema/newTableSchema'
import { VirtGrid } from 'vue-virt-list'

const createWorkspacePopover = ref()
const viewMode = ref<'grid' | 'table'>('grid')

// Use workspaces composable
const { workspaces, loading, getWorkspaces, searchWorkspaces, clearAllWorkspaces, deleteWorkspace } = useWorkspaces()

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

// Search state for database-level filtering
const useDbSearch = ref(false)

const routerProvider = inject(MenuRouterKey)

// Provide search handler to SearchableList (returns filtered results)
provide('onSearchParamsChange', async (params: any) => {
  if (!useDbSearch.value) return null // Use client-side filtering

  // Call database search and return results (doesn't modify workspaces.value)
  return await searchWorkspaces({
    keyword: params.keyword,
    filters: params.filters,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    isFilterStage: params.isFilterStage
  })
})

// Watch for mode changes
// watch(useDbSearch, async (newValue) => {
//   if (!newValue) {
//     // Switching back to client-side: ensure we have all data
//     if (workspaces.value.length === 0) {
//       await getWorkspaces()
//     }
//   }
// })

function handleCreateWorkspace(e: MouseEvent) {
  createWorkspacePopover.value.open(e.currentTarget as HTMLElement)
}

function handleCreateWorkspaceSuccess(workspace: any) {
  getWorkspaces()
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

function handleWorkspaceSelected(workspace: CaseTypeRecord) {
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
  // Handle workspace selection (e.g., navigate to workspace)
}

async function handleWorkspaceDelete(workspaceId: string) {
  try {
    await deleteWorkspace(workspaceId)
    // Workspace list will be automatically refreshed by deleteWorkspace
  } catch (error) {
    console.error('Failed to delete workspace:', error)
    // You might want to show an error message to the user here
  }
}

async function clearData() {
  await clearAllWorkspaces()
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
  getWorkspaces()
})
</script>

<template>
  <div class="pageContainer">
    <div class="pageHeader">
      <h1 class="title">Databases</h1>
      <div class="actions">
        <ElButton type="primary" @click="handleCreateWorkspace">Create Databases ({{ workspaces.length }})</ElButton>
      </div>
    </div>
    <div class="workspaceList">
      <UiSearchableList
        v-loading="loading"
        :data="workspaces"
        :search-keys="['name', 'description']"
        :default-sort-by="'name'"
        :default-sort-order="'asc'"
        @selected="handleWorkspaceSelected"
        @filtered="handleFiltered"
      >
        <template #actions>
          <!-- Toggle database search -->
          <ElTooltip :content="useDbSearch ? 'Using Database Search' : 'Using Client-side Search'" placement="bottom">
            <div :class="['action-button', { 'db-search-active': useDbSearch }]" @click="useDbSearch = !useDbSearch">
              <Icon :name="useDbSearch ? 'lucide:database' : 'lucide:search'" />
            </div>
          </ElTooltip>

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
                  <WorkspacesListCard :workspace="itemData" :keyword="keyword" @selected="handleWorkspaceSelected" @delete="handleWorkspaceDelete" />
                </template>
              </VirtGrid>
            </div>
          </template>
          <template v-if="viewMode === 'table'">
            <WorkspacesListTable ref="tableRef" :items="items" :keyword="keyword" @selected="handleWorkspaceSelected" />
          </template>
        </template>
      </UiSearchableList>
      <ElButton @click="clearData">Clear Data</ElButton>
    </div>
  </div>
  <UiPopoverDialog ref="createWorkspacePopover" title="Create Workspace">
    <WorkspacesCreateForm @created="handleCreateWorkspaceSuccess" />
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
