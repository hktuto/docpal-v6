<script setup lang="ts">
import WorkflowPreview from './preview.vue'

const props = withDefaults(
  defineProps<{
    docId?: string
    fileList?: Record<string, any>[]
  }>(),
  {
    docId: '',
    fileList: () => []
  }
)

const currentDocId = ref(props.docId ? String(props.docId) : '')

watch(
  () => props.docId,
  (id) => {
    const nextId = id ? String(id) : ''
    if (nextId && currentDocId.value !== nextId) currentDocId.value = nextId
  }
)

function handleTabChange(id: string | number) {
  currentDocId.value = String(id)
}
</script>

<template>
  <WorkflowPreview :doc-id="currentDocId">
    <template #title>
      <el-tabs :model-value="currentDocId" class="preview-file-tabs" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="file in fileList"
          :key="file.id"
          :label="file.file_name || file.name"
          :name="String(file.id)"
        />
      </el-tabs>
    </template>
  </WorkflowPreview>
</template>

<style scoped lang="scss">
.preview-file-tabs {
  width: 100%;

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap) {
    width: 100%;
  }

  :deep(.el-tabs__item) {
    max-width: 180px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: bottom;
    line-height: 40px;
  }
}
</style>
