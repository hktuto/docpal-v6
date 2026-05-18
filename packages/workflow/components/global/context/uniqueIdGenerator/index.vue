<script setup lang="ts">
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const generateIdTemplateList = ref<any[]>([])
const formData = ref({
  templateId: '',
  responseId: '',
  variables: []
})

const { getVariablesByDisplayTypes } = useVariablesProvide()
const stringFields = computed(() => {
  return getVariablesByDisplayTypes(['text'])
})
const stringAndNumberFields = computed(() => {
  return getVariablesByDisplayTypes(['text', 'number'], true)
})

async function getGenerateIdTemplateList() {
  const data: any = await newAdminApi.getDocpalIdTemplatesList().then((r) => r.data)
  generateIdTemplateList.value =
    data.map((item: any) => ({
      label: item.name,
      value: item.id,
      variables: getVariables([...item.prefix, ...item.suffix])
    })) || []
}

function getVariables(variableList: any) {
  return variableList
    .filter((item: any) => item.type === 'variable')
    .map((item: any) => ({
      label: item.expression.replace('{var(', '').replace(')}', ''),
      value: ''
    }))
}

function init() {
  const data = node.getData()
  formData.value.templateId = data.config?.http_request?.body?.templateId || ''
  const om: any = Object.keys(data.config.output_mapping)
  if (om.length > 0) {
    formData.value.responseId = om[0]
  } else {
    formData.value.responseId = ''
  }

  if (!!data.config?.http_request?.body?.variables) {
    formData.value.variables = Object.entries(data.config?.http_request?.body?.variables).map(([label, value]) => ({
      label,
      value
    }))
  } else {
    formData.value.variables = []
  }
}

function handleIdTemplateChange(templateId: string) {
  if (!generateIdTemplateList.value.some((item: any) => item.value === templateId)) {
    return
  }

  const idTemplate = generateIdTemplateList.value.find((item) => item.value === templateId)
  formData.value.variables = idTemplate.variables
  updateData()
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-http-field-data')
  const jsonObject = formData.value.variables.reduce((acc, { label, value }) => {
    acc[label] = value
    return acc
  }, {})

  const outputMapping = {
    [formData.value.responseId]: '${data}'
  }

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      http_request:{
        ...nodeData.config.http_request,
        body: {
          templateId: formData.value.templateId,
          variables: jsonObject
        }
      },
      input_mapping: {},
      output_mapping: outputMapping
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-http-field-data')
}

watch(
  () => node,
  async () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(async () => {
  await getGenerateIdTemplateList()
  // useWorkflowAdditionalContext(init)
})
</script>

<template>
  <SidebarLabel :node="node" />
  <el-form label-position="top" width="100%" :disabled="graphProvider.readonly.value">
    <el-form-item :label="$t('caseManagement.idGenerator')">
      <el-select v-model="formData.templateId" :placeholder="$t('caseManagement.idGenerator')" filterable @change="handleIdTemplateChange">
        <el-option v-for="item in generateIdTemplateList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="Response Unique Id">
      <el-select v-model="formData.responseId" placeholder="Response Unique Id" filterable @change="updateData">
        <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <template v-if="formData.variables.length > 0">
      <el-divider content-position="left">{{ $t('caseManagement.idTemplateVariables') }}</el-divider>
      <el-form-item v-for="item in formData.variables" :key="item.label" :label="item.label">
        <el-select v-model="item.value" :placeholder="$t('common_selectedIsRequiredMsg')" filterable @change="updateData">
          <el-option v-for="item in stringAndNumberFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
