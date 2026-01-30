<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { clientApi } from 'api'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}

const { bpmnGlobalRules } = editorProvider.BpmnRule
const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text')
})
const stringVariablesFields = computed(() => {
  if (!stringFields.value || stringFields.value.length === 0) return []

  return stringFields.value.map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const generateIdTemplateList = ref<any[]>([])
const templateId = ref('')
const info = ref('')
const variables = ref<any[]>([])

async function getGenerateIdTemplateList() {
  const data: any = await clientApi.admin.getAdmindocpalIdTemplatesList().then(r => r.data)
  generateIdTemplateList.value = data.map((item: any) => ({
    label: item.name,
    value: item.id,
    variables: getVariables([...item.prefix, ...item.suffix])
  })) || []
}

function getVariables(variableList: any) {
  return variableList.filter((item: any) => item.type === 'variable').map((item: any) => ({
    label: item.expression.replace('{var(', '').replace(')}', ''),
    value: ''
  }))
}

function handleIdTemplateChange(templateId: string) {
  if (!generateIdTemplateList.value.some((item: any) => item.value === templateId)) {
    return
  }

  const idTemplate = generateIdTemplateList.value.find((item) => item.value === templateId)
  variables.value = idTemplate.variables
  updateData('', 'variables')
}

function init() {
  const fields = node.getData().data.extensionElements['flowable:field']
  if (fields && fields.lenght < 1) {
    return
  }
  fields.forEach((item: any) => {
    switch (item.attr_name) {
      case 'templateId':
        templateId.value = item['flowable:expression'].__cdata
        break
      case 'workflowInfo':
        info.value = item['flowable:expression'].__cdata
        break
      case 'variables':
        console.log(item['flowable:expression'].__cdata)
        const varList= item['flowable:expression'].__cdata
        if(varList) {
          const json = JSON.parse(item['flowable:expression'].__cdata)
          variables.value = Object.entries(json).map(([label, value]) => ({
            label,
            value
          }))
        }else{
          variables.value = []
        }
        break
    }
  })
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    init()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    init()
  })
}

function updateData(newVal: string, name: string) {
  graphProvider?.graph.value?.startBatch('update-generate-id-template-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === name)
  if (name == 'variables') {
    const jsonObject = variables.value.reduce((acc, { label, value }) => {
      acc[label] = value
      return acc
    }, {})
    newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = JSON.stringify(jsonObject)
  } else {
    newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal || ''
  }

  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-generate-id-template-data')
}

watch(() => node, async () => {
  init()
}, {
  immediate: true,
  deep: true
})

watch(() => templateId.value, (newVal: string, oldVal: string) => {
  if (!newVal || newVal == '' || newVal == oldVal) return

  updateData(newVal, 'templateId')
})

onMounted(async () => {
  await getGenerateIdTemplateList()
  setUpListener()
  init()
})
</script>
<template>
  <div>
    <BpmnSidebarEditLabel :node="node" />
    <el-form label-position="top" width="100%" :disabled="editorProvider.readonly.value">
      <el-form-item :label="$t('caseManagement.idGenerator')">
        <el-select v-model="templateId" :placeholder="$t('caseManagement.idGenerator')" filterable
                   @change="handleIdTemplateChange">
          <ElOption v-for="item in generateIdTemplateList" :key="item.value" :label="item.label"
                    :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Form Info">
        <el-select v-model="info" placeholder="Form Info" filterable
                   @change="(val:any) => updateData(val,'workflowInfo')">
          <ElOption v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <template v-if="variables.length > 0">
        <el-divider content-position="left">{{ $t('caseManagement.idTemplateVariables') }}</el-divider>
        <el-form-item v-for="item in variables" :key="item.label" :label="item.label">
          <el-select v-model="item.value" :placeholder="$t('common_selectedIsRequiredMsg')" filterable
                     @change="updateData('','variables')">
            <ElOption v-for="item in stringVariablesFields" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>

</style>
