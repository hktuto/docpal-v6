<script lang="ts" setup>
import { ElSplitter } from 'element-plus';
import { useSingleWorkspace } from '../../../../composables/useSingleWorkspace';

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'table' | 'view' | 'dashboard'
}>()
const { workspace, menuActionsRef, getWorkspaceById, workspaceRouteParams } = useSingleWorkspace()

function getAsyncDetailComponent(){
  switch(workspaceRouteParams.value.detailType){
    case 'root':
      return 'LazyWorkspacesDetailRoot'
    case 'folder':
      return 'LazyWorkspacesDetailFolder'
    case 'table':
      if(workspaceRouteParams.value.detailId === 'setting'){
        return 'LazyWorkspacesDetailTableSetting'
      }
      return 'LazyWorkspacesDetailTable'
    case 'view':
      if(workspaceRouteParams.value.detailId === 'setting'){
        return 'LazyWorkspacesDetailViewSetting'
      }
      return 'LazyWorkspacesDetailView'
    case 'dashboard':
      if(workspaceRouteParams.value.detailId === 'setting'){
        return 'LazyWorkspacesDetailDashboardSetting'
      }
      return 'LazyWorkspacessDetailDashboard'
    default:
      return 'LazyWorkspaceDetailRoot'
  }
}

watch(props, async () => {
  await getWorkspaceById(props.id)
  if(props.detailId) {
    workspaceRouteParams.value.detailId = props.detailId
    workspaceRouteParams.value.detailType = props.detailType
  }
},{
  immediate: true,
  deep: true,
})
</script>

<template>
  <div class="pageContainer">
    <template v-if="!workspace">
    loading...
    </template>
    <template v-else>
      <ElSplitter>
        <ElSplitterPanel
        :min="120"
        size="220px"
        >
          <WorkspacesMenuHeader />
          <WorkspacesMenu 
            :workspace-id="workspace?.id"
            :initialMenu="workspace?.menu || []"
            :is-admin="true"
          >
            
           </WorkspacesMenu>
           <WorkspacesMenuActions
              ref="menuActionsRef"
            />
        </ElSplitterPanel>
        <ElSplitterPanel>
          <div class="detailContainer">
            <component :is="getAsyncDetailComponent()" />
          </div>
        </ElSplitterPanel>
      </ElSplitter>
    </template>
  </div>
</template>


<style lang="scss" scoped>
.detailContainer{
  height: 100%;
  width: 100%;
  overflow: hidden;
}
  .pageContainer{
    height: 100%;
    width: 100%;
  }
  :deep(.actionIcon){
    font-size: var(--app-font-size-m);
    cursor: pointer;
    color: var(--app-grey-600);
    line-height: 0;
    &:hover{
      color: var(--app-grey-300);
    }
  }
</style>
