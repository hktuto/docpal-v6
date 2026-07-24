<template>
  <div class="templateViewerContainer">
    <template v-if="!state.url">
      <div v-if="id">{{ $t('file.NoExist') }}</div>
    </template>
    <template v-else-if="state.fileType === 'application/pdf' && state.url">
      <LazyReaderPdf v-bind="props" :no-annotation="!!annotations"></LazyReaderPdf>
    </template>
    <template
      v-else-if="
        ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'].includes(state.fileType) && state.url
      "
    >
      <LazyReaderExcel
        :src="state.url"
        :blob="blob"
        :file-type="state.fileType"
        :name="name"
        :freeze-first-row="freezeFirstRow"
        :freeze-first-col="freezeFirstCol"
      ></LazyReaderExcel>
    </template>
    <template v-else-if="state.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'">
      <LazyReaderDocx v-bind="props"></LazyReaderDocx>
    </template>
    <template v-else-if="state.fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'">
      <LazyReaderPpt :blob="blob" />
    </template>
    <template v-else-if="state.fileType === 'image/tiff' && state.url">
      <LazyReaderTiff v-bind="props"></LazyReaderTiff>
    </template>
    <template v-else-if="state.fileType.includes('application/json')">
      <LazyReaderJson v-bind="props"></LazyReaderJson>
    </template>
    <template v-else-if="state.fileType.includes('text/')">
      <LazyReaderText v-bind="props"></LazyReaderText>
    </template>
    <audio v-else-if="state.fileType === 'audio/mpeg'" controls>
      <source :src="state.url" :type="state.fileType" />
    </audio>
    <video v-else-if="state.fileType === 'video/mp4'" controls style="width: 100%">
      <source :src="state.url" :type="state.fileType" />
    </video>
    <LazyViewerPicture v-else-if="state.fileType.includes('image/')" :images="[state.url]"></LazyViewerPicture>
    <template v-else>
      <h2 class="noSupportContainer">
        {{ state.fileType }}
        {{ $t('msg_thisFormatFileIsNotSupported') }}
      </h2>
    </template>
  </div>
</template>

<script lang="ts" setup>
type PdfJsOptions = {
  print: boolean
  loadAnnotations: boolean
  readOnly: boolean
}
const props = withDefaults(
  defineProps<{
    id: string
    blob: Blob
    name: string
    annotations?: Map<string, any>
    loading: Boolean
    options: PdfJsOptions
    freezeFirstRow?: boolean
    freezeFirstCol?: boolean
  }>(),
  {
    options: {
      print: false,
      loadAnnotations: false,
      readOnly: true
    },
    freezeFirstRow: false,
    freezeFirstCol: false
  }
)
const state = reactive({
  url: '',
  fileType: ''
})
function handleDownload() {
  downloadBlob(props.blob, props.name, props.blob.type)
}
watch(
  () => props.blob,
  (newBlob: Blob) => {
    if (!newBlob) return
    state.fileType = newBlob.type
    const urlCreator = window.URL || window.webkitURL
    state.url = urlCreator.createObjectURL(newBlob)
  },
  { immediate: true }
)
defineExpose({ handleDownload })
</script>

<style lang="scss" scoped>
.templateViewerContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
