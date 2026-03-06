<script lang="ts" setup>
import { WORKFLOW_PROVIDER } from '#imports'

const graphProvider = inject(WORKFLOW_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

function save() {
  const graph = graphProvider?.graph.value
  const workflowJson = graphProvider?.workflowJson.value
  const graphJson = graphProvider?.graphJson.value
  const nodes = graph.getNodes()
  const edges = graph.getEdges()
  console.log(22, nodes, workflowJson, graphJson)
  // 更新 nodes

  // 更新 edges

  // 更新 variables
}

function setupHistory() {
  graphProvider?.graph.value?.on('history:change', () => {
    state.value.canUndo = graphProvider?.graph.value?.canUndo() || false
    state.value.canRedo = graphProvider?.graph.value?.canRedo() || false
    // check if workflow is empty
    if (graphProvider?.graph.value?.getNodes() && graphProvider?.graph.value?.getNodes().length > 0) {
      // workflowDetail?.saveDraft()
    }
  })
}

function undo() {
  graphProvider?.graph.value?.undo()
}

function redo() {
  graphProvider?.graph.value?.redo()
}

const state = ref({
  canUndo: false,
  canRedo: false
})

onMounted(() => {
  setupHistory()
})
</script>

<template>
  <div class="icon">
    <Icon name="lucide:save" @click="save" />
    <div class="label">Save</div>
  </div>

  <div :class="{ icon: true, disabled: !state.canUndo }">
    <Icon name="lucide:undo-dot" @click="undo" />
    <div class="label">Undo</div>
  </div>
  <div :class="{ icon: true, disabled: !state.canRedo }">
    <Icon name="lucide:redo-dot" @click="redo" />
    <div class="label">Redo</div>
  </div>
</template>

<style lang="scss" scoped></style>
