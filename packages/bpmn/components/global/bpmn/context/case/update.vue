<script setup lang="ts">
import { clientApi } from 'api'
import type { Node } from '@antv/x6'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const routerProvider = inject(MenuRouterKey)
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule

const allFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value
})

const form = ref<any>({
  attr_caseTypeId: '',
  attr_name: '',
  field: []
})
const loading = ref(false)
const caseList = ref()
const caseOptionList = ref([])
const fieldsList = ref<string[]>(['case_id'])
const updateFieldsList = ref([])

async function getCaseLise() {
  try {
    const data: any = await clientApi.api.getCaseTypes({ deployed: true }).then((r: any) => r.data)
    caseList.value = data.map((item: any) => {
      return {
        id: item.id,
        name: item.name
      }
    })
  } catch (e) {
    console.log(e)
  }
}

async function init() {
  await getCaseLise()

  const extensionElements = node.data.data.extensionElements
  if ('' == extensionElements['flowable:newCase'].attr_caseTypeId) return

  form.value.attr_caseTypeId = extensionElements['flowable:newCase'].attr_caseTypeId
  form.value.attr_name = extensionElements['flowable:newCase'].attr_name

  const find = caseList.value.find((item: any) => item.id === form.value.attr_caseTypeId)
  if (!find) {
    caseOptionList.value = []
    return
  }

  if ('' !== form.value.attr_caseTypeId) {
    await getCaseOption()
  }

  if (extensionElements['flowable:newCase'].field.length === 0) return

  extensionElements['flowable:newCase'].field.forEach((item: any) => {
    const find: any = caseOptionList.value.find((caseItem: any) => caseItem.id === item.attr_metadata)
    if ('case_id' != item.attr_metadata) {
      fieldsList.value.push(item.attr_metadata)
    }
    if (!find) {
      return
    }

    find.formProperty = item.attr_formProperty
    form.value.field.push({
      attr_formProperty: item.attr_formProperty,
      attr_metadata: item.attr_metadata,
      attr_dataType: item.attr_dataType
    })
  })
  handleInitUpdateField()
}

function handleUpdateField() {
  handleInitUpdateField()
  form.value.field = form.value.field.filter((item: any) => fieldsList.value.includes(item.attr_metadata))
}

function handleInitUpdateField() {
  const list: any = []

  const caseId = caseOptionList.value.find((item: any) => item.id === 'case_id')
  if (!caseId) {
    routerProvider?.message.success('Please check your case settings; the case number field is missing.')
    updateFieldsList.value = []
  }

  list.push(caseId)

  if (fieldsList.value.length === 0) {
    updateFieldsList.value = list
  }

  const filter = caseOptionList.value.filter((item: any) => fieldsList.value.includes(item.id))
  updateFieldsList.value = list.concat(filter).filter((item: any, index, self: any) => index === self.findIndex((t: any) => t.id === item.id))
}

function handelFieldsList() {
  if (fieldsList.value.length === 0 || !fieldsList.value.includes('case_id')) {
    fieldsList.value.push('case_id')
  }
}

async function getCaseOption() {
  loading.value = true
  try {
    const caseData: any = await clientApi.api.getCaseTypesIdStarttask(form.value.attr_caseTypeId).then(r => r.data)
    if (!caseData) {
      caseOptionList.value = []
      return
    }

    if (caseData.length == 0) {
      caseOptionList.value = []
      return
    }
    const excludeList = ['created_date', 'created_by', 'modified_by']

    caseOptionList.value = caseData[caseData.length - 1].fields.filter((item: any) => !excludeList.includes(item.id))
      .map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          type: item.type
        }
      })
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

async function handleCase(caseId: string) {
  const find = caseList.value.find((item: any) => item.id === caseId)
  form.value.attr_name = find.name
  form.value.field = []
  await getCaseOption()
  setData()
  handleInitUpdateField()
}

function handleCaseField(item: any) {
  const { formProperty, id, type } = item
  const field = form.value.field
  if (!formProperty) {
    form.value.field = field.filter((formItem: any) => formItem.attr_metadata !== id)
  } else {
    const index = field.findIndex((formItem: any) => formItem.attr_metadata === id)
    if (index !== -1) {
      field[index].attr_formProperty = formProperty
    } else {
      field.push({
        attr_formProperty: formProperty,
        attr_metadata: id,
        attr_dataType: type
      })
    }
  }
  setData()
}

function setData() {
  graphProvider?.graph.value?.startBatch('update-case-field-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    data: {
      ...nodeData.data,
      extensionElements: {
        ...nodeData.data.extensionElements,
        'flowable:newCase': {
          ...nodeData.data.extensionElements['flowable:newCase'],
          ...JSON.parse(JSON.stringify(form.value))
        }
      }
    }
  }

  node.setData(newData, {
    overwrite: true,
    deep: true
  })
  graphProvider?.graph.value?.stopBatch('update-case-field-data')
}

onMounted(async () => {
  await init()
})

</script>

<template>
  <div>
    <BpmnSidebarEditLabel :node="node" />
    <el-form label-position="top" :disabled="editorProvider.readonly.value">
      <el-form-item label="Case" required>
        <el-select v-model="form.attr_caseTypeId" @change="handleCase" filterable>
          <el-option v-for="item in caseList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <div v-if="caseOptionList.length > 0">
        <el-divider />
        <span>Fields</span>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <el-select v-model="fieldsList" :placeholder="t('common_selectOccupancyContent')" multiple collapse-tags
                     collapse-tags-tooltip @change="handelFieldsList" >
            <el-option v-for="item in caseOptionList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-button @click="handleUpdateField">Update Field</el-button>
        </div>
      </div>

      <template v-loading="loading" v-for="item in updateFieldsList">
        <el-form-item :label="item.name" :required="'case_id'===item.id">
          <el-select v-model="item.formProperty" filterable clearable @change="handleCaseField(item)"
                     :placeholder="t('common_selectOccupancyContent')">
            <el-option v-for="field in allFields" :key="field.id" :label="field.name" :value="field.id" />
          </el-select>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<style scoped lang="scss">

</style>
