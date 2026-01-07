<script setup lang="ts">

const {openMenuItemActions: openActions, workspace} = useSingleWorkspaceContext()
const editIconRef = ref<HTMLElement>()

function handleOpenActions() {
  openActions({item: null, isAdmin: true}, editIconRef.value || undefined)
}


</script>

<template>
  <div  class="header">
    <div class="iconContainer">
      <Icon v-if="workspace?.icon" :name="workspace?.icon" />
      <span v-else>
        {{ workspace?.name.charAt(0) }}
      </span>
    </div>
    <h3>{{ workspace?.name }}</h3>
    <div class="actions">
      <div class="actionIcon" ref="editIconRef">
        <Icon name="material-symbols:edit" />
      </div>
      <div class="actionIcon" ref="editIconRef" @click="handleOpenActions">
        <Icon name="material-symbols:add" />
      </div>
    </div>
  </div>
</template>



<style lang="scss" scoped>
  .iconContainer{
    width: var(--app-font-size-l);
    height: var(--app-font-size-l);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--app-border-radius-s);
    background: var(--app-grey-800);
    color: var(--app-grey-200);
    cursor: pointer;
  }
.header{
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-s);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
}
h3{
  margin: 0;
  flex: 1 0 auto;
  font-weight: 900;
}
.actions{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
}
</style>
