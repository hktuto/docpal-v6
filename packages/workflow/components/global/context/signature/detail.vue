<script setup lang="ts">
import type { Node } from '@antv/x6'
import { CellType, createError } from '#imports'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const form = ref({
  documentStepId: '',
  signatureValue: ''
})
const signatureVariable = ref([])
const allDocumentStep = computed(() => {
  return (
    graphProvider?.graph?.value
      ?.getNodes()
      .filter((node) => {
        return node.getData()?.type === CellType.documentGenerationTask
      })
      .map((item: any) => ({
        value: item.getData().id,
        label: item.getData().name,
        templateId: item.getData().config.body.templateId
      })) || []
  )
})

function init() {}

async function getTemplateVariableList() {
  if (!form.value.documentStepId || form.value.documentStepId !== '') return

  const data = await newAdminApi.getDmsTemplateDocumentRefreshId(selectedStep.templateId).then((r) => r.data)
  if (data.fileType !== 'Word') {
    console.log('not word file')
    // reset form
    return
  }
  const variable = JsonSchemaToJsonData(data.templateVariable)
  if (!variable) {
    return
  }
  signatureVariable.value = variable.filter((item: any) => item.type === 'signature')
}
onMounted(() => {
  init()
})
</script>

<template>
  <ElForm :model="form" label-position="top" class="listItem">
    <ElFormItem label="Document Generate Step">
      <ElSelect v-model="form.documentStepId" placeholder="Document Step" filterable clearable @change="getTemplateVariableList">
        <ElOption v-for="item in allDocumentStep" :key="item.value" :label="item.label" :value="item.value" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="Signature">
      <ElSelect v-model="form.signatureValue" placeholder="Signature" filterable clearable>
        <ElOption v-for="item in signatureVariable" :key="item.id" :label="item.name" :value="item.id" />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="scss"></style>
