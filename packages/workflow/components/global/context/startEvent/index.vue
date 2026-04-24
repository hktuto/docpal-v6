<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const emits = defineEmits(['openForm'])
</script>

<template>
  <div class="fromContainer">
    <SidebarLabel :node="node" />
    <ContextStartEventCandidate :node="node" />
    <ContextStartEventAdditionLogic :node="node" />
    <ContextForm :node="node" />
    <ContextPreviewDocument v-if="node.data.type !== 'StartEvent'" :node="node" />
    <ContextUserTaskBooleanButton :node="node" />
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>
