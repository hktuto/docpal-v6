


<script setup lang="ts">
import LabelEditor from '../menu/labelEditor.vue'
import TextareaEditor from '../menu/textareaEditor.vue'

const props = defineProps<{
  isAdmin: boolean
}>()

const labelEditing = ref(false)
const descriptionEditing = ref(false)
const { menuState, workspaceRouteParams, findItemById, recursiveUpdateItem, saveMenuToDb, navigateToItem, getMenuIcon } = useSingleWorkspaceContext()

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
  labelEditing.value = false
}

function handleLabelCancel() {
  labelEditing.value = false
}

function handleDescriptionSave(newDescription: string) {
  if (currentFolder.value) {
    currentFolder.value.description = newDescription
    recursiveUpdateItem(menuState.value.items, workspaceRouteParams.value.detailId as string, currentFolder.value)
    saveMenuToDb()
  }
  descriptionEditing.value = false
}

function handleDescriptionCancel() {
  descriptionEditing.value = false
}

const calItemIcon = computed(() => {
  return getMenuIcon(currentFolder.value)
})

watch(workspaceRouteParams, () => {
  currentFolder.value = getCurrentFolder()
}, {
  deep: true,
})
</script>

<template>
  <div class="folder-detail">
    <div v-if="currentFolder" class="innerGrid">
      <h1 v-if="!labelEditing" @dblclick="labelEditing = true">
        {{ currentFolder?.label }}
      </h1>
      <div v-else class="label-editor-wrapper">
        <LabelEditor
          :model-value="currentFolder.label"
          @save="handleLabelSave"
          @cancel="handleLabelCancel"
        />
      </div>
      <p v-if="!descriptionEditing" @dblclick="descriptionEditing = true">
        <template v-if="isAdmin && !currentFolder?.description">
          <span class="no-description">No description. Double-click to add one.</span>
        </template>
        {{ currentFolder?.description }}
      </p>
      <div v-else class="description-editor-wrapper">
        <TextareaEditor
          :model-value="currentFolder.description || ''"
          @save="handleDescriptionSave"
          @cancel="handleDescriptionCancel"
        />
      </div>
      <div class="contentSection">
        <div v-for="child in currentFolder?.children" :key="child.id" 
        class="childrenCard"
        @click="navigateToItem(child)">
          <div class="childIcon">
            <Icon :name="calItemIcon" />
          </div>
          <div class="childLabel">
            {{ child.label }}
          </div>
          <p class="childDescription">
            {{ child.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .no-description{
    color: var(--app-grey-600);
  }
.innerGrid {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: var(--app-space-l);
}

h1 {
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
}

p {
  cursor: pointer;
  color: var(--el-text-color-regular);
  white-space: pre-line;
  
  &:hover {
    opacity: 0.8;
  }
}

.label-editor-wrapper {
  :deep(.label-editor) {
    margin-bottom: var(--app-space-m);
  }
  
  :deep(.label-input) {
    font-size: 2em;
    font-weight: bold;
    padding: 4px 8px;
    line-height: 1.2;
  }
}

.description-editor-wrapper {
  :deep(.textarea-input) {
    font-size: 1em;
    line-height: 1.5;
    padding: 6px 8px;
    color: var(--el-text-color-regular);
  }
}

.contentSection{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--app-space-m);
  .childrenCard{
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--app-space-s);
    padding: var(--app-space-s);
    cursor: pointer;
    &:hover{
      border-color: var(--app-primary-color);
    }
    .childIcon{
      font-size: var(--app-font-size-xxl);
    }
    .childLabel{
      font-size: var(--app-font-size-l);
      font-weight: bold;
    }
    .childDescription{
      margin: 0;
    }
  }
}
</style>
