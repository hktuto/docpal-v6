<script lang="ts" setup>

import { useEventListener } from '@vueuse/core'
import { newClientApi } from 'api'
const dialogOpend = ref(false)
const router = useRouter()
const tabProvider = inject(TabManagerKey)
async function handleWatermark(doc: any) {
    console.log("watermark trigger")
    let mimeType:any = '';
    if(!doc.properties){
        const data = await newClientApi.postDmsDocumentFetch({idOrPath:doc.id});
         mimeType = getMimeTypeFromDocument(data)
    }else{
        mimeType = getMimeTypeFromDocument(doc)
    }
    if(!mimeType || (!mimeType.includes('image') && !mimeType.includes('pdf') && !mimeType.includes('video'))){
        dialogOpend.value = true;
    }else{
        const newItem = createBrowseWatermarkPageParams({
            docId: doc.id,
            docName: doc.name
        })
        tabProvider?.openInCurrentTab(newItem)
    }
    // doc from props
}

onMounted(() => {
    useEventListener(document, 'docWatermark', (event: any) => handleWatermark(event.detail))
})

</script>

<template>
    <div></div>
    <ElDialog v-model="dialogOpend" >
        <div class="warning">
            {{  $t('error_watermark_mimetype') }}
        </div>
    </ElDialog>
</template>
