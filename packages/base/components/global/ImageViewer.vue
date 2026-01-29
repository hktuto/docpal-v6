<script setup lang="ts">
import { clientApi } from 'api'
const props = defineProps<{
  doc:any
}>()
const {doc} = toRefs(props);
const imgSrc = ref();
const loading = ref(false);
async function getData() {
  loading.value = true;
  try {
    const blob = await clientApi.api.postDmsDocumentPreview({idOrPath: props.doc.id},{
            format:'blob',
            timeout: 0,
            headers: {
                key: 'preview'
            }
        })
    imgSrc.value = window.URL.createObjectURL(blob);
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

<template>
  <div style="width:100%;height:100%;">
    
    <ViewerPicture v-if="imgSrc" :images="[imgSrc]" />
  </div>
</template>

<style scoped lang="scss">

</style>