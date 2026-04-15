<script setup lang="ts">
const form = ref({})
const signatureVariable= ref([])
const allDocumentStep= ref([])

function getTemplateVariableList(){

}


</script>

<template>
  <ElForm :model="form" label-position="top" class="listItem">
    <ElFormItem label="Document Generate Step">
      <ElSelect v-model="form.attr_documentStepId" placeholder="Document Step" filterable clearable
                @change="getTemplateVariableList(form.attr_documentStepId)">
        <ElOption v-for="item in allDocumentStep" :key="item.value" :label="item.label" :value="item.value" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="Signature">
      <ElSelect v-model="form.attr_signature" placeholder="Signature" filterable clearable>
        <ElOption v-for="item in signatureVariable" :key="item.id" :label="item.name" :value="item.id" />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="scss"></style>
