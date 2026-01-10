<script setup lang="ts">

const {openMenuItemActions: openActions, workspace, navigateToItem, saveWorkspaceToDb} = useSingleWorkspaceContext()
const editIconRef = ref<HTMLElement>()
const routerProvider = inject(MenuRouterKey)
function handleOpenActions() {
  openActions({item: null, isAdmin: true}, editIconRef.value || undefined)
}

function handleIconSelected(icon: string) {
  if(!workspace.value) return
  workspace.value.icon = icon
  saveWorkspaceToDb()
}

function goBackList() {
  const item = {
    id: "demo-workspaces",
    name: "demo-workspaces",
    label: "Demo Workspaces",
    icon: "icon-park-outline:database-forbid",
    hoverIcon: "icon-park-outline:database-forbid",
    component: "LazyWorkspacesList",
    props: {},
  }
  routerProvider?.navigateTo(item)
}
</script>

<template>
  <div  class="header">
    <Icon class="backIcon" name="lucide:chevron-left" @click="goBackList" />
    <div class="iconContainer" @click="navigateToItem()">
      <UiIconPicker class="workspaceIcon" iconSize="var(--app-font-size-m)" :modelValue="workspace.icon || ''" @update:modelValue="handleIconSelected" />
      
    </div>
    <h3 @click="navigateToItem()">{{ workspace?.name }}</h3>
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
  .backIcon{
    font-size: var(--app-font-size-l);
    cursor: pointer;
  }
  .iconContainer{
    --icon-size: var(--app-font-size-m);
    width: var(--app-font-size-l);
    height: var(--app-font-size-l);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--app-border-radius-s);
    background: var(--app-grey-800);
    color: var(--app-grey-200);
    cursor: pointer;
    padding: var(--app-space-s);
    z-index: 5;
  }

  h3{
    cursor: pointer;
  }
.header{
  width: 100%;
  padding: var(--app-space-s) var(--app-space-s);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
  height: var(--app-header-height);
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
