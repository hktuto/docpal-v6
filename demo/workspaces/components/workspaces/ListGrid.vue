<template>
  <div class="pageContainer">
    <div class="pageHeader">
      <h1 class="title">Workspaces</h1>
      <div class="actions">
        <ElButton type="primary" @click="handleCreateWorkspace">Create Workspace</ElButton>
      </div>
    </div>
    <div class="workspaceList">
      <div class="workspaceItem" v-for="workspace in workspaces" :key="workspace.id">
        <div class="workspaceName">{{ workspace.name }}</div>
        <div class="workspaceDescription">{{ workspace.description }}</div>
      </div>
    </div>
  </div>
  <UiPopoverDialog ref="createWorkspacePopover" title="Create Workspace">
    <WorkspacesCreateForm @created="handleCreateWorkspaceSuccess" />
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import type { WorkspaceType } from '../../utils/db/schema/workspaces'
const createWorkspacePopover = ref()

const {query} = usePglite()
const workspaces = ref<WorkspaceType[]>([])

async function getWorkspaces() {
  const data = await query(`SELECT * FROM workspaces`)
  console.log(data)
  workspaces.value = data
}

function handleCreateWorkspace(e: MouseEvent) {
  createWorkspacePopover.value.open(e.currentTarget as HTMLElement)
}

function handleCreateWorkspaceSuccess() {
  getWorkspaces()
  createWorkspacePopover.value.close()
}

onMounted(() => {
  getWorkspaces()
})
</script>

<style lang="scss" scoped>
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
</style>
