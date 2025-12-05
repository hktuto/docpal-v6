<script setup lang="ts">
const { loading, editMode, editable, loadAnnotations, print, readOnly, docDetail } = defineProps<{
  loading: boolean
  editMode?: boolean
  editable?: boolean
  loadAnnotations?: boolean
  print?: boolean
  readOnly?: boolean
  docDetail: any
}>()

const isPdf = ref(false)
const readerType = computed(() => {
  try {
    isPdf.value = false
    if (docDetail.comeFrom === 'google_drive' || docDetail.path.startsWith('/google_drive')) {
      return resolveComponent('LazyGoogleDrive')
    }
    if (!docDetail) {
      return resolveComponent('LazyOtherPlayer')
    }
    const mimeType = getMimeTypeFromDocument(docDetail)
    console.log(mimeType)

    if (!mimeType) return resolveComponent('LazyPdfViewer') // set to pdf for testing
    // check if it is excel

    if (canCollaboraEdit(mimeType)) {
      return resolveComponent('LazyCollaboraViewer')
    }
    if (mimeType.includes('text/html')) {
      return resolveComponent('LazyHtmlViewer')
    }
    if (mimeType.includes('tiff')) {
      return resolveComponent('LazyTiffViewer')
    }
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('gif') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('photoshop') ||
      mimeType.includes('psd') ||
      mimeType.includes('illustrator') ||
      mimeType.includes('text')
    ) {
      isPdf.value = true
      return resolveComponent('LazyPdfViewer')
    }
    if (mimeType.includes('image')) {
      return resolveComponent('LazyImageViewer')
    }
    if (mimeType.includes('video') || mimeType.includes('audio')) {
      return resolveComponent('LazyVideoPlayer')
    }
    return resolveComponent('LazyOtherPlayer')
  } catch (error) {
    return resolveComponent('LazyOtherPlayer')
  }
})
const PreviewRef = ref()
function handleRefresh(needRefresh: boolean = true) {
  // TODO: rbac check validate(stop for backend error)
  if (PreviewRef.value && needRefresh) {
    if (PreviewRef.value.refresh) PreviewRef.value.refresh()
  }
}
</script>

<template>
  <div class="previewContent">
    <div v-if="loading || !docDetail || !docDetail.properties" class="noSupportContainer">
      {{ $t('common_loading') }}
    </div>
    <template v-else>
      <div v-if="readerType" class="preview">
        <component
          :is="readerType"
          ref="PreviewRef"
          :docId="docDetail.id"
          :doc="docDetail"
          :editMode="editMode"
          fileType="NUXEO"
          :readonly="true"
          :editable="RbacAllowTo('write', docDetail)"
          :options="{
            loadAnnotations: true && allowFeature('DOC_ANNOTATION'),
            print: RbacAllowTo('print', docDetail) && allowFeature('DOC_PRINT'),
            readOnly: !RbacAllowTo('write', docDetail) || !allowFeature('DOC_ANNOTATION')
          }"
          @saved="() => handleRefresh(false)"
        />
        <slot name="previewOverlay" />
        <!-- <BrowseAiPopover v-if="appStore.licenseFeatures.ASK_AI"  :doc="docDetail"></BrowseAiPopover> -->
      </div>
      <h2 v-else class="noSupportContainer">
        {{ $t('msg_thisFormatFileIsNotSupported') }}
      </h2>
    </template>
  </div>
</template>

<style scoped lang="scss">
.previewContent {
  width: 100%;
  height: 100%;
  position: relative;
  // overflow: hidden;
  .preview {
    width: 100%;
    height: 100%;
  }
}
</style>
