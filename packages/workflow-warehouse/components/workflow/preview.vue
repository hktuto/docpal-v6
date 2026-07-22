<script setup lang="ts">
import { newClientApi } from 'api'

const props = withDefaults(
  defineProps<{
    docId?: string
  }>(),
  {
    docId: ''
  }
)

const previewFile = reactive({
  blob: null as Blob | null,
  name: '',
  id: '',
  loading: false,
  options: {
    readOnly: true
  }
})

async function loadPreview(docId: string) {
  if (!docId) {
    previewFile.blob = null
    previewFile.id = ''
    previewFile.name = ''
    return
  }

  previewFile.loading = true
  try {
    previewFile.blob = await newClientApi.postDmsDocumentPreview(
      { idOrPath: docId },
      {
        format: 'blob',
        timeout: 0,
        headers: {
          key: 'preview'
        }
      }
    )
    previewFile.id = docId
  } catch (error) {
    console.error(error)
    previewFile.blob = null
  } finally {
    previewFile.loading = false
  }
}

watch(
  () => props.docId,
  (docId) => {
    docId && loadPreview(docId)
  },
  { immediate: true }
)
</script>

<template>
  <div v-loading="previewFile.loading" class="workflow-preview">
    <Reader v-if="previewFile.blob" v-bind="previewFile" />
  </div>
</template>

<style scoped lang="scss">
.workflow-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
