<script setup lang="ts">
import { useMouse } from '@vueuse/core'
import { EventType, useEventBus} from 'eventbus'
import { clientApi } from 'api'
import { ElDialog } from 'element-plus'
const openBus = useEventBus(EventType.FILE_PREVIEW_OPEN)
const closeBus = useEventBus(EventType.FILE_PREVIEW_CLOSE)
openBus.on(open)
closeBus.on(close)

const opened = ref(false);
const loading = ref(false);
const docDetail = ref();
const previewImgUrl = ref('')
const previewSize = ref(500);


async function getDocPreview(idOrPath:string) {
    loading.value = true
    try{
        const blob = await clientApi.api.postDmsDocumentThumbnail({idOrPath},{
            format:'blob',
            timeout: 0,
            headers:{
                'noThrowError' : "true"
            }
        }) as any
        if (!!blob) {
            const urlCreator = window.URL || window.webkitURL
            previewImgUrl.value = urlCreator.createObjectURL(blob)
        }else{
            previewImgUrl.value = ""
        }
    }catch(err){
        previewImgUrl.value = ""
    }finally{
        loading.value = false
    }
}

async function open(doc:any) {
    console.log('open', doc)
    if(doc.isFolder) {
        docDetail.value = null
        previewImgUrl.value = ""
        opened.value = false
        return;
    }
    if(docDetail.value?.id === doc.id && opened.value) {
        return;
    }
    docDetail.value = doc
    getDocPreview(doc.id)
    opened.value = true
}

function close(){
    opened.value = false
    docDetail.value = null
    previewImgUrl.value = ""
}

function imgError(event:any) {
    event.target.src = '/icons/file-general.svg'
}

onUnmounted(() => {
    openBus.off(open)
    closeBus.off(close)
})

defineExpose({
    open,
    close
})

</script>

<template>
  <el-dialog v-model="opened" width="90%" :show-close="true" :close-on-click-modal="true" @close="close" class="popPreviewDialog" append-to-body center>
    <div v-loading="loading" class="imgContainer">
      <template v-if="previewImgUrl">
        <img :src="previewImgUrl" class="thumbnail" @error="imgError" />
      </template>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.popPreviewDialog {
  .el-dialog__body {
    padding: 0;
  }
}
.imgContainer{
    max-width: 800px;
    max-height: 100%;
    img{
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
}
</style>
