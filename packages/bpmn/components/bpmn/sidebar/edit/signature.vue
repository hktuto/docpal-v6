<script lang="ts" setup>
import { useI18n } from '#imports'
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
type Form = {
  attr_documentStepId: string
  attr_signature: string
}
const defaultForm: Form = {
  attr_documentStepId: '',
  attr_signature: ''
}
const form = ref<Form>({ ...defaultForm })

function setForm() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    data: {
      ...nodeData.data,
      extensionElements: {
        ...nodeData.data.extensionElements,
        'docpal:signatureSetting': JSON.parse(JSON.stringify(form.value))
      }
    }
  }
  node.setData(newData, {
    deep: true,
    overwrite: true
  })
}

function refreshData() {
  const nodeData = node.getData()
  const signatureSetting = nodeData.data.extensionElements['docpal:signatureSetting']
  if (signatureSetting) {
    form.value = signatureSetting
  }
}

// #region setup
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
const { bpmnGlobalRules, getBpmnRuleType, setBpmnRules, getTaskFieldRules } = editorProvider.BpmnRule

const allDocumentStep = computed(() => {
  return graphProvider.graph.value?.getNodes().filter((element: any) => {
    const nodeData = element.getData()
    if (!nodeData.data || !nodeData.data['attr_flowable:delegateExpression']) {
      return false
    }
    if (nodeData.data['attr_flowable:delegateExpression'] === '${generateDocumentDelegate}') {
      return true
    }
    return false
  }).map(element => ({
    value: element.data.data.attr_id,
    label: element.data.data.attr_name,
    templateId: element.data.data.extensionElements['flowable:field'].find((item: any) => item.attr_name === 'templateId')?.['flowable:expression']?.['__cdata'] || ''
  })) || []
})

if (!graphProvider || !editorProvider) {
  throw createError('provider not found')
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}

const signatureVariable = ref<any[]>([])

async function getTemplateVariableList(stepDefinitionKey: string) {
  const selectedStep = allDocumentStep.value.find((item: any) => item.value === stepDefinitionKey)
  const data = await newAdminApi.getDmsTemplateDocumentRefreshId(selectedStep.templateId).then(r => r.data)
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
  // get all nodes in graph

  setUpListener()
})
watch(
  () => node,
  () => {
    if (node) {
      refreshData()
      if (form.value.attr_documentStepId) {
        getTemplateVariableList(form.value.attr_documentStepId)
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
)
watch(form, () => {
  setForm()
  if (form.value.attr_documentStepId) {
    getTemplateVariableList(form.value.attr_documentStepId)
  }
}, {
  deep: true
})

</script>
<template>
  <div class="formComponentContainer">
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
  </div>
</template>
