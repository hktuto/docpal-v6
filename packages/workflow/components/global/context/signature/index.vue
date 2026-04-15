<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()

const switchRef = ref(true)
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

function handleSwitch() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  if (switchRef.value) {

  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
}

watch(() => node, () => {
  if (node) {
    switchRef.value = 'attr_flowable:candidateGroups' in node.data.data
  }
}, {
  immediate: true,
  deep: true
})
</script>

<template>
  <div class="fromContainer">
    <SidebarLabel :node="node" />
    <ContextUserTaskAssignee :node="node" />
    <el-switch :disabled="graphProvider.readonly.value" v-model="switchRef" size="small" active-text="Group"
               inactive-text="Roles" @change="handleSwitch" />
    <BpmnSidebarEditCandidateGroup v-if="switchRef" :node="node" />
    <BpmnSidebarEditCandidateRoles v-else :node="node" />
    <BpmnSidebarEditSignature :node="node" />
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
