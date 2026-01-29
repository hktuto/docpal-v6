<script lang="ts" setup>
import { clientApi } from 'api'
const dialogOpend = ref(false)
const {doc} = defineProps<{
    doc: any
}>()
const router = useRouter()
const routerProvider = inject(MenuRouterKey)
async function addWartermark(){
    let mimeType:any = '';
    if(!doc.properties){
        const data = await clientApi.api.postDmsDocumentFetch({idOrPath:doc.id});
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
        routerProvider?.navigateTo(newItem)
        // router.push({
        //     path: '/browse/watermark',
        //     query: {
        //         docId: doc.id
        //     }
        // })
    }
}

</script>


<template>
   <BrowseActionsButton id="watermarkActionButton" :label="$t('filePopover_watermark')" @click="addWartermark">
    
    <SvgIcon src="/icons/menu/watermark.svg" round :content="$t('filePopover_watermark')"
                ></SvgIcon>
  </BrowseActionsButton> 
  <ElDialog v-model="dialogOpend" >
        <div class="warning">
            {{  $t('error_watermark_mimetype') }}
        </div>
    </ElDialog>
</template>