


<script setup lang="ts">


const props = defineProps<{
  isAdmin: boolean
}>()

const { menuState, workspaceRouteParams, findItemById, recursiveUpdateItem, saveMenuToDb } = useSingleWorkspaceContext()

const currentFolder = ref()

function getCurrentFolder() {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
}

onMounted(() => {
  currentFolder.value = getCurrentFolder()
})

function handleLabelSave(newLabel: string) {
  if (currentFolder.value) {
    currentFolder.value.label = newLabel
    recursiveUpdateItem(menuState.value.items, workspaceRouteParams.value.detailId as string, currentFolder.value)
    saveMenuToDb()
  }
}

function handleDescriptionSave(newDescription: string) {
  if (currentFolder.value) {
    currentFolder.value.description = newDescription
    recursiveUpdateItem(menuState.value.items, workspaceRouteParams.value.detailId as string, currentFolder.value)
    saveMenuToDb()
  }
}

watch(workspaceRouteParams, () => {
  currentFolder.value = getCurrentFolder()
}, {
  deep: true,
})
</script>

<template>
  <div class="folder-detail">
    <div v-if="currentFolder" class="innerGrid">
      <UiInlineEditor
        :model-value="currentFolder.label"
        wrapper="h1"
        :editable="isAdmin"
        @save="handleLabelSave"
      />
      <UiInlineEditor
        :model-value="currentFolder.description || ''"
        wrapper="p"
        :editable="isAdmin"
        :multiline="true"
        placeholder="No description. Double-click to add one."
        @save="handleDescriptionSave"
      />
      <WorkspacesMenuChildrenGrid
        v-if="currentFolder?.children?.length"
        :children="currentFolder.children"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.innerGrid {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: var(--app-space-l);
}

:deep(p) {
  color: var(--el-text-color-regular);
  white-space: pre-line;
}
</style>
