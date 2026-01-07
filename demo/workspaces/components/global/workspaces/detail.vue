<script lang="ts" setup>
import { ElSplitter } from 'element-plus';
import { useSingleWorkspace } from '../../../composables/useSingleWorkspace';

const props = defineProps<{
  id: string
  detailId: string | null
  detailType: 'root' | 'folder' | 'table' | 'view' | 'dashboard'
}>()
const { workspace, menuActionsRef, getWorkspaceById, workspaceRouteParams } = useSingleWorkspace()

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
            <template v-if="workspaceRouteParams.detailType === 'root'">
              <template v-if="!workspaceRouteParams.detailId">
                root overview here
              </template>
              <template v-else-if="workspaceRouteParams.detailId === 'setting'">
                <div class="detailContent">
                  root Setting here
                </div>
              </template>
            </template>
            <template v-else-if="workspaceRouteParams.detailType === 'folder'">
              
              <template v-if="workspaceRouteParams.detailId === 'setting'">
                <div class="detailContent">
                  folder Setting here
                </div>
              </template>
              <template v-else>
                <WorkspacesDetailFolder :is-admin="true" />
              </template>
            </template>
            <template v-else-if="workspaceRouteParams.detailType === 'table'">
              <template v-if="workspaceRouteParams.detailId === 'setting'">
                <div class="detailContent">
                  Table Setting here
                </div>
              </template>
              <template v-else>
                Table overview here
              </template>
            </template>
            <template v-else-if="workspaceRouteParams.detailType === 'view'">
              <template v-if="workspaceRouteParams.detailId === 'setting'">
                <div class="detailContent">
                  view Setting here
                </div>
              </template>
              <template v-else>
                view overview here
              </template>
            </template>
            <template v-else-if="workspaceRouteParams.detailType === 'dashboard'">
              <template v-if="workspaceRouteParams.detailId === 'setting'">
                <div class="detailContent">
                  dashboard Setting here
                </div>
              </template>
              <template v-else>
                dashboard overview here
              </template>
            </template>
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
