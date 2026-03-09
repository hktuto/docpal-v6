<script lang="ts" setup>

const props = defineProps<{
    disabled: boolean,
    formData: any
    options: any,
}>();

const {disabled, formData, options} = toRefs(props) 

const docId = ref('');

function getFormData(){
  return JSON.parse(JSON.stringify(formData.value))
}

function getInfo(){
  docId.value = formData.value[options.value.data.updateField]
}

defineExpose({ getFormData })

watch( formData, () => {
  getInfo()
}, {
  immediate: true,
  deep: true
})

onMounted(() => {
  getInfo()
})

onDeactivated(() => {
  docId.value = ''
  props.formData = null;
})


</script>

<template>
  <div class="editDocumentContainer">
    <CollaboraViewer v-if="docId" :docId="docId" :readonly="true" :editable="true"  fileType="NUXEO" />
  </div>
</template>


<style lang="scss" scoped>
.editDocumentContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;
}
</style>
