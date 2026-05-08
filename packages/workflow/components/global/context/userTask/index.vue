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
</script>

<template>
  <div class="fromContainer">
    <SidebarLabel :node="node" />
    <ContextUserTaskAssignee :node="node" />
    <ContextUserTaskPermissions :node="node" />
    <ContextUserTaskAdditional :node="node" />
    <ContextForm :node="node" />
    <ContextUserTaskBooleanButton :node="node" />
  </div>
</template>

<style lang="scss" scoped></style>
