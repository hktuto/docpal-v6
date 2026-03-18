<script lang="ts" setup>
import JsonEditorVue from 'json-editor-vue'

const visible = ref(false)
const formJson = ref();
const emit = defineEmits(['update'])
function open(json:any){
  visible.value = true;
  formJson.value = {...json}
}

function close(){
  visible.value = false;
  formJson.value = null
}

function save(){
  emit('update', deepCopy(formJson.value))
}

defineExpose({
  open,
  close
})

</script>

<template>
<ElDialog v-model="visible" fullscreen>
    <div class="editor">

    <JsonEditorVue v-model="formJson" >
    </JsonEditorVue>
    </div>
    <template #footer>
    <ElButton @click="close">Cancel</ElButton>
    <ElButton type="primary" @click="save">Save</ElButton>
    </template>
</ElDialog>
</template>

<style lang="scss" scoped>
.editor{
    width: 100%;
    height: calc(100vh - 91px);
    overflow: auto;
    position: relative;
}

</style>
