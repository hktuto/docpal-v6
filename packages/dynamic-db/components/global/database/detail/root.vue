<script setup lang="ts">
const props = defineProps<{
  isAdmin: boolean
}>()

const { database, updateDatabase, menuState } = useSingleDatabaseContext()
const routerProvider = inject(MenuRouterKey)

function handleLabelSave(name: string) {
  if (!name || !database.value) {
    routerProvider?.message.error('Name is required')
    return
  }
  database.value.name = name
  updateDatabase()
}
function handleIconSelected(icon: string) {
  if (!database.value) return
  database.value.icon = icon
  updateDatabase()
}
function handleDescriptionSave(description: string) {
  console.log("save", description, database.value)
  if (!database.value) return
  database.value.description = description
  updateDatabase()
}
</script>

<template>
  <div class="rootDetailContainer">
    <UiIconPicker :style="{ '--icon-size': 'var(--app-font-size-xxl)' }" :modelValue="database?.metadata.icon || ''" @update:modelValue="handleIconSelected">
      {{ database?.name.slice(0, 1).toUpperCase() }}
    </UiIconPicker>
    <UiInlineEditor :model-value="database?.name || ''" wrapper="h1" :editable="isAdmin" @save="handleLabelSave" />
    <UiInlineEditor
      :model-value="database?.description || ''"
      wrapper="p"
      :editable="isAdmin"
      :multiline="true"
      placeholder="No description. Double-click to add one."
      @save="handleDescriptionSave"
    />
    <DatabaseMenuChildrenGrid :children="menuState.items || []" />
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
