<template>
    <div v-loading="loading" class="htmlContainer" >
        <iframe :srcdoc="src" />
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    doc:any
}>()
const {doc} = toRefs(props);
const src = ref();
const loading = ref(false);

async function getData() {
    loading.value = true;
    try {
        const blob = await DownloadDocApi(props.doc.id);
        src.value =  await blob.text();
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
.htmlContainer{
    width: 100%;
    height: 100%;
}
iframe {
    background: #fff;
    width: 100%;
    height: 100%;
    border: none;
}
</style>