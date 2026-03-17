<script setup lang="ts">
import hljs from 'highlight.js';
//@ts-ignore
import CodeEditor from 'simple-code-editor';
const visible = ref(false);
const modelValue = defineModel();

const localValue = computed({
  get: () => modelValue.value,
  set: (value) => {
    modelValue.value = value;
  },
});



</script>

<template>
<ElButton @click="visible = true">Edit</ElButton>
<ElDialog v-model="visible" fullscreen>
<span>function(detail, setting) {</span>
  <CodeEditor :wrap="true" :header="false" width="100%" theme="github"  :languages="[['javascript','JS']]" v-model="localValue" />
  <span>}</span>
</ElDialog>
</template>
<style lang="scss">
.code-editor .code-area > pre{
    display: flex;
}
</style>
