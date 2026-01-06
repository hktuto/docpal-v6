<script lang="ts" setup>
import { ElSplitter } from 'element-plus';
import { useSingleWorkspace } from '../../../composables/useSingleWorkspace';

const { id } = defineProps<{
  id: string
}>()
const { workspace, menuActionsRef, getWorkspaceById } = useSingleWorkspace()

onMounted(async () => {
  await getWorkspaceById(id)
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
        :min-size="120"
        size="220px"
        >
          <WorkspacesMenuHeader />
          <WorkspacesMenu 
            :workspace-id="workspace?.id"
            :initialMenu="workspace?.menu || []"
            :is-admin="true"
          >
          <WorkspacesMenuActions
            ref="menuActionsRef"
           />
           </WorkspacesMenu>
        </ElSplitterPanel>
        <ElSplitterPanel>
          detail view here
        </ElSplitterPanel>
      </ElSplitter>
    </template>
  </div>
</template>

<style lang="scss" scoped>

  .pageContainer{
    height: 100%;
    width: 100%;
    
  }
</style>
