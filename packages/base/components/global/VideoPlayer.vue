<template>
    <div v-loading="loading" class="videoPlayerContainer" >
        <video :src="videoSrc" controls />
    </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
const props = defineProps<{
    doc:any
}>()
const {doc} = toRefs(props);
const videoSrc = ref();
const loading = ref(false);
async function getData() {
    loading.value = true;
    try {
        const blob = await newClientApi.postDmsDocumentPreview({idOrPath: props.doc.id},{
            format:'blob',
            timeout: 0,
            headers: {
                key: 'preview'
            }
        })
        const url = window.URL.createObjectURL(blob);
        videoSrc.value = url;
    } catch (error) {
        
    }
    loading.value = false;
}
function refresh() {
    getData()
}
defineExpose({ refresh })
watch(doc, () => {
    getData();
},{
    immediate: true
})


</script>

<style lang="scss" scoped>
.videoPlayerContainer {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    margin: 0 auto;
    overflow: hidden;
    background: var(--app-grey-0000);
    border-radius: 12px;
    position: relative;
    video {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        object-fit: contain;
    }
}
</style>