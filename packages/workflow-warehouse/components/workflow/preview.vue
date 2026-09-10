<script setup lang="ts">
import { newClientApi } from 'api'

const readerRef = ref<any>(null)
const {selectedInvoice} = useWHASupplyListVerifyInject()
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

function search(query: string) {
  readerRef.value?.search(query)
}

function readerReadyHandler() {
  // search the invoice name when the reader is ready
  setTimeout(() => {
    search(selectedInvoice.value[SGLA.Name])
  },300)
}

watch(
  () => props.docId,
  (docId) => {
    docId && loadPreview(docId)
  },
  { immediate: true }
)

watch(
  () => selectedInvoice,
  (invoice) => {
    if (invoice) {
      search(invoice.value[SGLA.Name])
    }
  },
  { deep: true }
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
    <Reader ref="readerRef" class="reader" v-if="previewFile.blob" v-bind="previewFile" @ready="readerReadyHandler" freeze-first-row freeze-first-col />
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
