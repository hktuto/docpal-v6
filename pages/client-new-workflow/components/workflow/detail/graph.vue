<script lang="ts" setup>
const { contentData } = defineProps<{
  taskDetail: any
  contentData: any
}>()

const viewerRef = ref()

watch(
  () => contentData,
  () => {
    nextTick(() => {
      viewerRef.value.init()
    })
  },
  { immediate: true }
)
</script>

<template>
  <div class="bpmnContainer">
    <WorkflowReplayViewer ref="viewerRef" :content-json="contentData" autoplay />
  </div>
</template>

<style lang="scss" scoped>
.bpmnContainer {
  height: 100%;
  min-height: 400px;
  overflow: auto;
}

#modeler-container {
  height: 100%;
  width: 100%;
}
</style>
