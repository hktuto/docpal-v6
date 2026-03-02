<script setup lang="ts">
import json from './testWorkflow.json'

const workflowEditorRef = ref()

function getData() {
  workflowEditorRef.value?.init(json)
}

onMounted(() => {
  getData()
})
</script>

<template>
  <div class="pageContainer">
    <WorkflowEditor ref="workflowEditorRef" />
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
