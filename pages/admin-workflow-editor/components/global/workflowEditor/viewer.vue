<script lang="ts" setup>
import { newClientApi } from 'api';
import {BpmnViewer} from '#components'
const { id, latestVersion, productionVersion } = defineProps<{
    id: string
    latestVersion: string,
    productionVersion: string
}>()

const loading = ref(false)
const viewerRef = ref<InstanceType<typeof BpmnViewer>>();
    
async function getData() {
    loading.value = true;

    const xmlBlob = await newClientApi.workflowVersionController.getBpmnxml({draftId:id, versionNumber:latestVersion}, {
        format: 'blob'
    }) as unknown as Blob
    const bpmn = await xmlBlob.text()
    const json = await newClientApi.workflowVersionController.getJson({draftId:id, versionNumber:latestVersion}, {})
    if(json && json.data){
        const x6Json = JSON.parse(json.data)
        viewerRef.value?.init(bpmn, x6Json)
    }else{
        viewerRef.value?.init(bpmn)
    }
    loading.value = false;
}

watch(() => id, (newId) => {
    if(newId) {
        getData()
    }
})

onMounted(() => {
    getData()
})
</script>

<template>
    <div class="viewerContainer">
        <div class="status">
            <template v-if="!productionVersion">
               <div class="draft">{{  $t('workflowEditor.viewer.draft') }} : {{ latestVersion }}</div>
            </template>
            <template v-else>
                <template v-if="productionVersion === latestVersion">
                    <div class="production">{{  $t('workflowEditor.viewer.production') }} : {{ latestVersion }}</div>
                </template>
                <template v-else>
                    <!-- TODO : display switch to production version -->
                    <!-- <div class="production">{{  $t('workflowEditor.viewer.production') }} : {{ productionVersion }}</div> -->
                    <div class="latest">{{  $t('workflowEditor.viewer.latest') }} : {{ latestVersion }}</div>
                </template>
            </template>
        </div>
        <BpmnViewer v-loading="loading" ref="viewerRef" :options="{}" />
    </div>
</template>

<style lang="scss" scoped>
.status{
    position: absolute;
    top: var(--app-space-xs);
    left: var(--app-space-xs);
    z-index: 3;
    > div {
        padding: var(--app-space-xs) var(--app-space-s);
        border-radius: var(--app-border-radius-s);
        background-color: var(--app-grey-700);
        color: var(--app-grey-000);
        font-size: var(--app-font-size-s);
    }
    .production{
        background-color: var(--app-main-color);
        color: var(--app-paper);
    }
    .latest {
        background-color: var(--app-accent-color);
        color: var(--app-paper);

    }
}
.viewerContainer{
    height: 600px;
    position: relative;
    // height: 100%;
}
</style>