<script lang="ts" setup>
import { newClientApi, newAdminApi } from 'api'
import type { Node } from '@antv/x6'
import { QuestionFilled } from '@element-plus/icons-vue'
import { JsonSchemaToJsonData } from 'docpal-document-editor/src/client'

const editorProvider = inject(EDITOR_PROVIDER)
if (!editorProvider) {
  throw createError('editor provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule
const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
if (!graphProvider) {
  throw new Error('Missing provider')
}

const documentTypeList = ref<any[]>([])

const allFieldWithVariableGet = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item: any) => {
    return {
      id: item.id,
      name: item.name
    }
  })
})
const staticStringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const state = reactive({
  status: true
})

const allDocumentTemplates = ref<any[]>([])

const form = ref<any>({
  parentPath: '',
  storeValue: '',
  documentName: '',
  documentType: '',
  templateId: ''
})
const variableForm = ref<any>([])
const defaultField = ['parentPath', 'storeValue', 'documentName', 'documentType', 'templateId']

async function init() {
  const documentTypeData: any = await newClientApi.getDmsDocpalTypeActive().then(res => res.data)
  documentTypeList.value = documentTypeData.filter((item: any) => !item.isFolder)

  const documentData: any = await newAdminApi.getDmsTemplateDocument().then(r => r.data)
  allDocumentTemplates.value = documentData.map((item: any) => {
    return {
      id: item.id,
      name: item.name,
      value: item
    }
  })

  const index = node.getData().data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === 'storeValue')
  state.status = index != -1

  getForm()
}

function getForm() {
  const fields: any[] = node.data.data.extensionElements['flowable:field']
  if (fields && fields.length === 0) {
    return
  }
  fields.forEach((item: any) => {
    if (defaultField.includes(item.attr_name)) {
      form.value[item.attr_name] = item['flowable:expression'].__cdata
    }
  })

  if (!form.value.templateId || '' == form.value.templateId) {
    variableForm.value = []
    return
  }
  getTemplateVariableList()
}

function updateFieldData(key: string, newVal: string) {
  graphProvider?.graph.value?.startBatch('update-new-document-field-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === key)
  if (index !== -1) {
    newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal || ''
  } else {
    newData.data.extensionElements['flowable:field'].push({
      'attr_name': key,
      'flowable:expression': {
        '__cdata': newVal || ''
      }
    })
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-new-document-field-data')
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    getForm()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    getForm()
  })
}


function handleStatus() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }
  const name = state.status ? 'storeValue' : 'parentPath'

  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === name)
  if (index == -1) {
    newData.data.extensionElements['flowable:field'].push(
      { 'attr_name': name, 'flowable:expression': { '__cdata': '' } })
  }

  const dName = state.status ? 'parentPath' : 'storeValue'
  newData.data.extensionElements['flowable:field'] = newData.data.extensionElements['flowable:field'].filter((f: any) => f.attr_name !== dName)

  node.setData(newData, { overwrite: true, deep: true })
}

const loading = ref(false)

async function handleChangeTemplateId() {
  // When switching templates, clear old data
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  newData.data.extensionElements['flowable:field'] = newData.data.extensionElements['flowable:field'].filter((item: any) => {
    if (defaultField.includes(item.attr_name)) {
      if (item.attr_name === 'templateId') {
        item['flowable:expression'].__cdata = form.value.templateId
      }
      return item
    }
  })
  node.setData(newData, { overwrite: true, deep: true })

  loading.value = true
  try {
    await getTemplateVariableList()
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

async function getTemplateVariableList() {
  variableForm.value = []
  const data: any = await newAdminApi.getDmsTemplateDocumentRefreshId(form.value.templateId).then(r => r.data)
  const fields: any[] = node.data.data.extensionElements['flowable:field']

  if (data.fileType === 'Word') {
    const variable = await JsonSchemaToJsonData(data.templateVariable)
    if (!variable) {
      return
    }

    // File type used for template output
    variable.unshift({
      id: 'system_output_file_type',
      name: 'Output File Type',
      type: 'text',
      value: ''
    })

    variable.forEach((item: any) => {
      const find = fields.find(field => field.attr_name === item.id)
      if (find) {
        item.value = find['flowable:expression']?.__cdata.replace('${variables:get(', '').replace(')}', '')
      }
    })
    variableForm.value = variable
    return
  }

  //  Excel or PPT
  const templateVariables = JSON.parse(data.templateVariable as any)
  variableForm.value = templateVariables.map((item: string) => {
    const find = fields.find(field => field.attr_name === item)

    return {
      id: item,
      name: item,
      value: find ? find['flowable:expression']?.__cdata.replace('${variables:get(', '').replace(')}', '') : ''
    }
  })
}

async function updateVariableData(key: string, newVal: string) {
  graphProvider?.graph.value?.startBatch('update-new-document-variable-field-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === key)
  if (index !== -1) {
    if (!!newVal && '' !== newVal) {
      // update
      newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal
    } else {
      // delete
      newData.data.extensionElements['flowable:field'].splice(index, 1)
    }
  } else {
    // insert
    newData.data.extensionElements['flowable:field'].push({
      'attr_name': key,
      'flowable:expression': {
        '__cdata': newVal || ''
      }
    })
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-new-document-field-data')
}

watch(() => node, async () => {
  if (node && node.data) {
    getForm()
  }
}, {
  immediate: true,
  deep: true
})

onMounted(async () => {
  await init()
  setUpListener()
})
</script>

<template>
  <div class="fromContainer">
    <BpmnSidebarEditLabel :node="node" />
    <div class="formContainer">
      <div class="generateDocumentFormContainer">
        <el-form label-position="top" :disabled="editorProvider.readonly.value">
          <el-switch v-model="state.status" active-text="Store Value" inactive-text="Parent Path"
                     @change="handleStatus" />
          <el-form-item v-if="state.status" label="Store Value" required>
            <el-select v-model="form.storeValue" :placeholder="t('common_selectedIsRequiredMsg')" clearable
                       @change="(val:any) => updateFieldData('storeValue', val)">
              <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-else>
            <template #label>
              <div style="display: flex; align-items: center; gap: 4px;">
                <label class="label"> {{ t('Parent Path') }}</label>
                <el-popover width="300" title="Info" placement="top"
                            content="Only path formats are supported. 'folder/folder'">
                  <template #reference>
                    <el-icon style="cursor: pointer; color: #909399;">
                      <QuestionFilled />
                    </el-icon>
                  </template>
                </el-popover>
              </div>
            </template>

            <el-select v-model="form.parentPath" :placeholder="t('common_selectedIsRequiredMsg')"
                       @change="(val:any) => updateFieldData('parentPath', val)">
              <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="Document Name" required>
            <el-select v-model="form.documentName" :placeholder="t('common_selectedIsRequiredMsg')"
                       @change="(val:any) => updateFieldData('documentName', val)">
              <el-option v-for="item in staticStringFields" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="Document Type" required>
            <el-select v-model="form.documentType" :placeholder="t('common_selectedIsRequiredMsg')" filterable
                       @change="(val:any) => updateFieldData('documentType', val)">
              <el-option v-for="item in documentTypeList" :key="item.name" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
          <el-form-item v-loading="loading" label="Document Template" required>
            <el-select v-model="form.templateId" :placeholder="t('common_selectedIsRequiredMsg')" filterable
                       @change="handleChangeTemplateId">
              <el-option v-for="item in allDocumentTemplates" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-divider />

          <template v-loading="loading" v-for="item in variableForm" :key="item.id">
            <el-form-item :label="item.name">
              <el-select v-model="item.value" :placeholder="t('common_selectedIsRequiredMsg')"
                         filterable clearable @change="(val:any) => updateVariableData(item.id, val)">
                <el-option v-for="item in allFieldWithVariableGet" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}

.label::before {
  content: "*";
  color: var(--el-color-danger);
  margin-right: 4px;
}

</style>

