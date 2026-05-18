<script setup lang="ts">
import type { Node } from '@antv/x6'
import { CellType, createError } from '#imports'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'
import { newAdminApi } from 'api'

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
const signatureVariable = ref<{
  id: string
  name: string
  type: string
  value: string
}>([])
const allDocumentStep = computed(() => {
  return (
    graphProvider?.graph?.value
      ?.getNodes()
      .filter((node) => {
        const data = node.getData()
        return !!data?.metadata && data?.metadata?.type === CellType.documentGenerationTask
      })
      .map((item: any) => {
        const data = item.getData()
        return {
          value: data.id,
          label: data.name,
          templateId: data.config?.http_request?.body?.templateId || ''
        }
      }) || []
  )
})

function init() {
  const data = node.getData()

  form.value.documentStepId = data.metadata.signature.documentStepId || ''
  form.value.signatureValue = data.metadata.signature.signatureValue || ''

  if (!!form.value.documentStepId && form.value.documentStepId !== '') {
    getTemplateVariableList()
  }
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-signature-data')

  const nodeData = node.getData()
  const data = {
    ...nodeData,

    metadata: {
      ...nodeData.metadata,
      signature: form.value
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(data, {
    deep: true,
    overwrite: true
  })

  graphProvider?.graph.value?.stopBatch('update-signature-data')
}

async function updateDocumentId() {
  await getTemplateVariableList()
  updateData()
}

async function getTemplateVariableList() {
  if (!form.value.documentStepId || form.value.documentStepId === '') return
  const selectedStep = allDocumentStep.value.find((item: any) => item.value === form.value.documentStepId)
  const data = await newAdminApi.getDmsTemplateDocumentRefreshId(selectedStep.templateId).then((r: any) => r.data)
  if (data.fileType !== 'Word') {
    console.log('not word file')
    return
  }
  const variable = JsonSchemaToJsonData(data.templateVariable)
  if (!variable) {
    return
  }
  signatureVariable.value = variable.filter((item: any) => item.type === 'signature')
}

watch(
  () => node,
  () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form :model="form" size="small" label-position="top" class="listItem">
    <el-form-item label="Document Generate Step">
      <el-select v-model="form.documentStepId" placeholder="Document Step" filterable clearable @change="updateDocumentId">
        <el-option v-for="item in allDocumentStep" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="Signature">
      <el-select v-model="form.signatureValue" placeholder="Signature" filterable clearable @change="updateData">
        <el-option v-for="item in signatureVariable" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
