<script setup lang="ts">
import json from './testWorkflow.json'

const workflowEditorRef = ref()

function getData() {
  workflowEditorRef.value?.init()
}
const workflowData = ref<any>()
const processKey = ref<string>('')
const version = ref<number>()

onMounted(() => {
  workflowData.value = json
  processKey.value = json.key
  nextTick(getData)
})
</script>

<template>
  <div class="pageContainer">
    <WorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="false" :process-key="processKey" :version="version" />
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
