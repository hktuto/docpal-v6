<script lang="ts" setup>

import { clientApi } from 'api'

const props = defineProps<{
  doc: any
}>()

const state = reactive({
  loading: false,
  blob: null,
  encodeUrl: ''
})
const fileType = computed(() => {
  console.log(props.doc)
  if (!props.doc || !props.doc.fileRelativePath) return 'notSupport'
  if (props.doc.isFolder) return 'folder'
  return checkExtension(props.doc.fileRelativePath)
})

async function getBlobFile(id: string) {
  state.loading = true
  state.blob = await clientApi.api.getDmsUploadTmpFileIdDownload(id,{
    format: 'blob'
  })
  state.encodeUrl = URL.createObjectURL(state.blob)
  state.loading = false
}

async function readBlobToText(blob: Blob) {
  const text = await blob.text()
  return text
}

function checkExtension(filename: string) {
  const ext = filename.split('.').pop()
  if (!ext) return 'notSupport'
  const collaboraList = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  const imgList = ['jpg', 'png', 'jpeg', 'tif', 'gif', 'webp', 'bmp', 'svg']
  const textList = ['txt']
  const pdfList = ['pdf']
  const videoList = ['mp4']
  if (collaboraList.includes(ext)) {
    return 'collabora'
  }
  getBlobFile(props.doc.id)
  if (imgList.includes(ext)) {
    return 'image'
  }
  if (textList.includes(ext)) {
    return 'text'
  }
  if (pdfList.includes(ext)) {
    return 'pdf'
  }
  if (videoList.includes(ext)) {
    return 'video'
  }
  return 'notSupport'
}
</script>

<template>
  <div class="viewerContainer">
    <template v-if="fileType === 'folder'">
      <SvgIcon src="icons/folder.svg" />
    </template>
    <!-- <template v-else-if="fileType === 'image'">
      <ViewerPicture :images="[state.encodeUrl]" />
    </template> -->
    <template v-else-if="fileType === 'text'">
     <ReaderText :blob="state.blob" />
    </template>
    <template v-else-if="fileType === 'collabora'">
      <LazyCollaboraViewer :docId="props.doc.id" fileType="LOCAL" :readonly="true" />
    </template>
    <template v-else-if="fileType === 'pdf'">
      <LazyViewerPdf v-if="state.blob" :blob="state.blob" :options="{print:false, loadAnnotations:false, readOnly:true}" />
    </template>
    <template v-else-if="fileType === 'video'">
      <Video v-if="state.encodeUrl" :src="state.encodeUrl" />
      <!--      <VideoViewer :fileName="props.doc.fileName" />-->
    </template>
    <template v-else>
      <LazyReader v-if="state.blob" :blob="state.blob" />
      <!--      <VideoViewer :fileName="props.doc.fileName" />-->
    </template>
  </div>
</template>

<style scoped lang="scss">
.viewerContainer {
  width: 100%;
  height: 100%;
}
</style>
