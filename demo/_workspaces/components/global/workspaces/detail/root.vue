<script setup lang="ts">
const props = defineProps<{
  isAdmin: boolean
}>()

const { workspace, saveWorkspaceToDb, menuState } = useSingleWorkspaceContext()
const routerProvider = inject(MenuRouterKey)

function handleLabelSave(name: string) {
  if (!name || !workspace.value) {
    routerProvider?.message.error('Name is required')
    return
  }
  workspace.value.name = name
  saveWorkspaceToDb()
}
function handleIconSelected(icon: string) {
  if (!workspace.value) return
  workspace.value.icon = icon
  saveWorkspaceToDb()
}
function handleDescriptionSave(description: string) {
  if (!workspace.value) return
  workspace.value.description = description
  saveWorkspaceToDb()
}
</script>

<template>
  <div class="rootDetailContainer">
    <UiIconPicker :style="{ '--icon-size': 'var(--app-font-size-xxl)' }" :modelValue="workspace?.metadata.icon || ''" @update:modelValue="handleIconSelected">
      {{ workspace?.name.slice(0, 1).toUpperCase() }}
    </UiIconPicker>
    <UiInlineEditor :model-value="workspace?.name || ''" wrapper="h1" :editable="isAdmin" @save="handleLabelSave" />
    <UiInlineEditor
      :model-value="workspace?.description || ''"
      wrapper="p"
      :editable="isAdmin"
      :multiline="true"
      placeholder="No description. Double-click to add one."
      @save="handleDescriptionSave"
    />
    <WorkspacesMenuChildrenGrid :children="menuState.items || []" />
  </div>
</template>

<style lang="scss" scoped>
.rootDetailContainer {
  margin: 0 auto;
  width: 100%;
  max-width: var(--app-max-width);
  padding: var(--app-space-l);
}

:deep(p) {
  color: var(--el-text-color-regular);
  white-space: pre-line;
  font-size: var(--app-font-size-l);
}
</style>
