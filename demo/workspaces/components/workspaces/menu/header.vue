<script setup lang="ts">

const {workspace} = useSingleWorkspaceContext()
const {openMenuItemActions: openActions} = useSingleWorkspaceContext()
const editIconRef = ref<HTMLElement>()

function handleEdit() {
  openActions({item: null, isAdmin: true}, editIconRef.value || undefined)
}


</script>

<template>
  <div  class="header">
    <h3>{{ workspace?.name }}</h3>
    <div class="actions">
      <div class="actionIcon" ref="editIconRef" @click="handleEdit">
        <Icon name="material-symbols:add" />
      </div>
    </div>
    
  </div>
</template>



<style lang="scss" scoped>
.header{
  width: 100%;
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
h3{
  margin: 0;
  flex: 1 0 auto;
}
</style>
