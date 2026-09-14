<script setup lang="ts">
import { newClientApi } from 'api'

const readerRef = ref<any>(null)

const props = withDefaults(
  defineProps<{
    docId?: string
    /** Invoice number / text to highlight in the preview reader */
    searchText?: string
  }>(),
  {
    docId: '',
    searchText: ''
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

function search(query?: string) {
  const text = String(query ?? props.searchText ?? '').trim()
  if (!text) return
  readerRef.value?.search(text)
}

function readerReadyHandler() {
  setTimeout(() => {
    search()
  }, 300)
}

watch(
  () => props.docId,
  (docId) => {
    if (docId) loadPreview(docId)
    else {
      previewFile.blob = null
      previewFile.id = ''
      previewFile.name = ''
    }
  },
  { immediate: true }
)

watch(
  () => props.searchText,
  (text) => {
    if (text) search(text)
  }
)

defineExpose({
  search
})
</script>

<template>
  <div v-loading="previewFile.loading" class="workflow-preview">
    <div class="workflow-preview__title">
      <slot name="title">{{ previewFile.name }}</slot>
    </div>
    <Reader
      v-if="previewFile.blob"
      ref="readerRef"
      class="reader"
      v-bind="previewFile"
      freeze-first-row
      freeze-first-col
      @ready="readerReadyHandler"
    />
  </div>
</template>

<style scoped lang="scss">
.workflow-preview {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .workflow-preview__title {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  .reader {
    flex: 1;
    min-width: 0;
    min-height: 0;
    width: 100%;
  }
}
</style>
