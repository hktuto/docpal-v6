<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const RuleManageDialogRef = ref()

function editField() {
  RuleManageDialogRef.value.open()
}
</script>

<template>
  <div class="fromContainer">
    <SidebarLabel :node="node" />
    <ContextStartEventCandidate :node="node" />
    <ContextStartEventAdditionLogic :node="node" />
    <el-button style="width: 100%" type="primary" id="Workflow__Start__EditField" @click="editField">{{ $t('Workflow Global Variables') }}</el-button>
  </div>

  <LazyContextVariableManageDialog ref="RuleManageDialogRef" />
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>
