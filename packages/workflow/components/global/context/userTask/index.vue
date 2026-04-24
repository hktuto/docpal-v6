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

watch(
  () => node,
  () => {
    if (node) {
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="fromContainer">
    <SidebarLabel :node="node" />
    <ContextUserTaskAssignee :node="node" />
    <ContextUserTaskPermissions :node="node"/>
    <ContextForm :node="node" />
    <ContextUserTaskPreviewDocument :node="node" />
    <ContextUserTaskBooleanButton :node="node" />
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>
