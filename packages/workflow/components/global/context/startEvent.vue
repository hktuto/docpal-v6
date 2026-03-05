<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const emits = defineEmits(['openForm'])
</script>

<template>
  <div class="fromContainer">
    <WorkflowSidebarLabel :node="node" />
    <WorkflowSidebarStartCandidate :node="node" />
    <WorkflowSidebarStarterAdditionLogic :node="node" />
    <WorkflowSidebarForm :node="node" />
    <WorkflowSidebarPreviewDocument v-if="node.data.type !== 'StartEvent'" :node="node" />
<!--    <WorkflowSidebarBooleanButton :node="node" />-->
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>
