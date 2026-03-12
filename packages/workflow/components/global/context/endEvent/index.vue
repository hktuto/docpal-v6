<script lang="ts" setup>
import type { Node } from '@antv/x6'
const { node } = defineProps<{
  node: Node
}>()

const editorProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!editorProvider) {
  throw createError('graph provider not found')
}
const fieldEditorRef = ref()

async function pasteForm() {
  editorProvider?.pasteForm(node)
}

function editCompleteForm() {
  // get all form field
}
</script>

<template>
  <div class="fromContainer">
    <ElButton type="primary" @click="editorProvider.openForm(node)" :disabled="editorProvider.readonly.value">Edit Form</ElButton>
    <ElButton type="primary" @click="editorProvider.previewForm(node)">Preview Form</ElButton>
    <div class="actionsContainer">
      <ElButton
        v-if="editorProvider.copyKey.value && editorProvider.copyKey.value !== 'end'"
        type="link"
        size="small"
        :disabled="editorProvider.readonly.value"
        @click="pasteForm"
      >
        Paste Form
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
  margin-top: var(--app-space-m);
}
.actionsContainer {
  margin-top: var(--app-space-m);
}
</style>
