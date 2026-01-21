<script setup lang="ts">
import {clientApi} from 'api';
const props = defineProps<{
  doc: any
}>()
const previewUrl = ref("");
async function getPreview(){
  if(props.doc.isFolder) {
    previewUrl.value = "/icons/folder-general.svg"
    return
  }
  const blob: any = await clientApi.api.postDmsDocumentThumbnail({idOrPath:props.doc.id}, {
    format: 'blob',
    timeout: 0,
    headers: {
        key: 'preview'
    }
  })
  console.log("blob", blob)
  if (blob) {
    const urlCreator = window.URL || window.webkitURL;
    previewUrl.value = urlCreator.createObjectURL(blob)
  }else {
    previewUrl.value = "/icons/file-general.svg"
  }
}

function imgError(event:any) {
  event.target.src = '/icons/file-general.svg'
}

watch(() => props.doc, () => {
  getPreview()
}, {immediate: true})
</script>

<template>
  <div class="previewContainer">
    <img v-if="previewUrl"  :src="previewUrl" @error="imgError" />
  </div>
</template>

<style scoped lang="scss">
.previewContainer{
  aspect-ratio: 1 /1;
  max-width: 100%;
  height: 100%;
  max-height: 200px;
  margin: 0 auto;
  // border: 1px solid var(--app-grey-400);
  background: #fff;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
