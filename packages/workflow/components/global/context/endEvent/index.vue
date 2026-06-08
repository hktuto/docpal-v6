<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { createError } from '#imports'
const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

async function pasteForm() {
  graphProvider?.pasteForm(node)
}
</script>

<template>
  <div class="fromContainer">
    <!--    <el-button type="primary" @click="graphProvider.openForm(node)" :disabled="editorProvider.readonly.value">Edit Form</el-button>-->
    <!--    <el-button type="primary" @click="graphProvider.previewForm(node)">Preview Form</el-button>-->
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
