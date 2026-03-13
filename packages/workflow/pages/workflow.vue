<script setup lang="ts">
function getWorkflowJson() {}
</script>

<template>
  <div class="pageContainer">
    <WorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" @refresh="getWorkflowJson" />
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
