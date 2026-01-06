<script setup lang="ts">
import type { WorkspaceType } from '../../utils/db/schema/workspaces'
import { WorkspaceSchema } from '../../utils/db/schema/workspaces.zod'

const createWorkspacePopover = ref()
const viewMode = ref<'grid' | 'table'>('grid')
const { query } = usePglite()
const workspaces = ref<WorkspaceType[]>([])

const routerProvider = inject(MenuRouterKey)
async function getWorkspaces() {
  const data = await query(`SELECT * FROM workspaces`)
  workspaces.value = data
}

function handleCreateWorkspace(e: MouseEvent) {
  createWorkspacePopover.value.open(e.currentTarget as HTMLElement)
}

function handleCreateWorkspaceSuccess() {
  getWorkspaces()
  createWorkspacePopover.value.close()
}

function handleWorkspaceSelected(workspace: WorkspaceType) {
  console.log('Selected workspace:', workspace)
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

function clearData() {
  workspaces.value = []
  query(`DELETE FROM workspaces`)
}

onMounted(() => {
  getWorkspaces()
})
</script>

<template>
  <div class="pageContainer">
    <div class="pageHeader">
      <h1 class="title">Workspaces</h1>
      <div class="actions">
        <ElButton type="primary" @click="handleCreateWorkspace">Create Workspace</ElButton>
      </div>
    </div>
    <div class="workspaceList">
      <UiSearchableList
        :data="workspaces"
        :zod-schema="WorkspaceSchema"
        :search-keys="['name', 'description', 'slug']"
        :default-sort-by="'name'"
        :default-sort-order="'asc'"
        @selected="handleWorkspaceSelected"
      >
      <template #actions>
        <!-- toggle action for table view and card view -->
        <div class="action-button">
          <Icon :name="viewMode === 'grid' ? 'lucide:grid-3x2' : 'lucide:table'" @click="viewMode = viewMode === 'grid' ? 'table' : 'grid'" />
        </div>
      </template>
        <template #default="{ items }">
          <template v-if="viewMode === 'grid'">
            <TransitionGroup name="list" tag="div" class="cardGridContainer">
            <WorkspacesListCard
                v-for="workspace in items"
                :key="workspace.id"
                :workspace="workspace"
                @selected="handleWorkspaceSelected"
              />
            </TransitionGroup>
          </template>
          <template v-if="viewMode === 'table'">
            <WorkspacesListTable
              :items="items"
            />
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
  .pageContainer{
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }
  .searchable-list{
    height: 100%;
  }
  :deep(.cardGridContainer){
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--app-space-s);
    }
  .pageHeader{
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-s);
    padding: var(--app-space-xs) var(--app-space-s);
    .title{
      flex: 1 0 auto;
      line-height: 1;
    }
    
  }
  .workspaceList{
    padding: var(--app-space-xs) var(--app-space-s);
    display:flex;
    flex-direction: column;
    gap: var(--app-space-s);
    height: 100%;
  }
  .action-button{
    display: flex;
    background: var(--app-grey-800);
    color: var(--app-text-color-secondary);
    font-size: var(--app-font-size-m);
    padding: var(--app-space-xs);
    border-radius: var(--app-border-radius-m);
    cursor: pointer;
    :hover{
      
      border-radius: var(--app-border-radius-s);
      background: var(--app-text-color);
    }
  }
</style>
