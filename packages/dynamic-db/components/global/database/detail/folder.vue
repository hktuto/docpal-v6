<script setup lang="ts">
const props = defineProps<{
  isAdmin: boolean
}>()

const { menuState, databaseMenuRouteParams, findItemById, saveMenuItemToDb } = useSingleDatabaseContext()

const currentFolder = ref()

function getCurrentFolder() {
  if (!databaseMenuRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId as string)
}

onMounted(() => {
  currentFolder.value = getCurrentFolder()
})

function handleLabelSave(newLabel: string) {
  if (currentFolder.value) {
    try {
      const params = {
        name: newLabel,
        id: currentFolder.value.id
      }
      // recursiveUpdateItem(menuState.value.items, databaseMenuRouteParams.value.detailId as string, currentFolder.value)
      saveMenuItemToDb(params)
      currentFolder.value.name = newLabel
    } catch (error) {
      console.error('Error saving label:', error)
    }
  }
}

function handleDescriptionSave(newDescription: string) {
  if (currentFolder.value) {
    try {
      const params = {
        description: newDescription,
        id: currentFolder.value.id
      }
      saveMenuItemToDb(params)
      currentFolder.value.description = newDescription
    } catch (error) {
      console.error('Error saving description:', error)
    }
  }
}

watch(
  databaseMenuRouteParams,
  () => {
    currentFolder.value = getCurrentFolder()
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="folder-detail">
    <div v-if="currentFolder" class="innerGrid">
      <UiInlineEditor :model-value="currentFolder.name" wrapper="h1" :editable="isAdmin" @save="handleLabelSave" />
      <UiInlineEditor
        :model-value="currentFolder.description || ''"
        wrapper="p"
        :editable="isAdmin"
        :multiline="true"
        placeholder="No description. Double-click to add one."
        @save="handleDescriptionSave"
      />
      <DatabaseMenuChildrenGrid v-if="currentFolder?.children?.length" :children="currentFolder.children" />
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
  font-size: var(--app-font-size-l);
}
</style>
