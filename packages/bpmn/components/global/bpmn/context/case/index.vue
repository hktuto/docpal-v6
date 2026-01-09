<script setup lang="ts">
import { clientApi } from 'api'
import type { Node } from '@antv/x6'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}

const { setBpmnRules, bpmnGlobalRules } = editorProvider.BpmnRule

const allFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value
})

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text')
})

const form = ref<any>({
  attr_caseTypeId: '',
  attr_name: '',
  attr_systemCaseInstanceId: '',
  field: []
})
const caseTypeId = ref('')
const caseName = ref('')
const caseReturnId = ref('')
const fields = ref<any[]>([])

const loading = ref(false)
const caseList = ref()
const caseOptionList = ref([])

async function getCaseLise() {
  const data: any = await clientApi.api.getCaseTypes({ deployed: true }).then((r: any) => r.data)
  caseList.value = data.map((item: any) => {
    return {
      id: item.id,
      name: item.name
    }
  }) || []
}

async function init() {
  const extensionElements = node.data.data.extensionElements
  if ('' == extensionElements['flowable:newCase'].attr_caseTypeId) return

  caseTypeId.value = extensionElements['flowable:newCase'].attr_caseTypeId
  caseName.value = extensionElements['flowable:newCase'].attr_name
  caseReturnId.value = extensionElements['flowable:newCase'].attr_systemCaseInstanceId

  const find = caseList.value.find((item: any) => item.id === caseTypeId.value)
  if (!find) {
    caseOptionList.value = []
    return
  }

  if ('' !== caseTypeId.value) {
    await getCaseOption()
  }

  if (extensionElements['flowable:newCase'].field.length === 0) return

  extensionElements['flowable:newCase'].field.forEach((item: any) => {
    const find: any = caseOptionList.value.find((caseItem: any) => caseItem.id === item.attr_metadata)
    find.formProperty = item.attr_formProperty
    form.value.field.push({
      attr_formProperty: item.attr_formProperty,
      attr_metadata: item.attr_metadata,
      attr_dataType: item.attr_dataType
    })
  })
}

async function getCaseOption() {
  loading.value = true
  try {
    const caseData: any = await clientApi.api.getCaseTypesIdStarttask(caseTypeId.value).then((r) => r.data)

    if (caseData.length == 0) {
      caseOptionList.value = []
      return
    }
    const excludeList = ['created_date', 'created_by', 'modified_by', 'case_id']

    caseOptionList.value = caseData[caseData.length - 1].fields
      .filter((item: any) => !excludeList.includes(item.id))
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
  if (!find) {
    return
  }
  caseName.value = find.name
  form.value.field = []
  await getCaseOption()
  setData()
}

function handleCaseReturnId() {
  if (caseReturnId.value && '' !== caseReturnId.value) {
    setData()
  }
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
    version: (nodeData.version || 0) + 1,
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

async function importFields() {
  const defaultFields = ['id', 'modified_by', 'modified_date', 'created_by', 'created_date', 'status']
  const rules = caseOptionList.value
    .filter((item: any) => !defaultFields.includes(item.name))
    .filter((item: any) => bpmnGlobalRules.value.findIndex((rule: any) => rule.id === item.id.toLowerCase()) === -1)
    .map((item: any) => {
      const params: any = {
        maxLength: item.maxLength || 200
      }
      return {
        id: item.id.toLowerCase(),
        name: item.name,
        type: getType(item.type),
        ...params
      }
    })
  if (rules.length === 0) {
    ElMessage.info(t('dpMsg_noDataUpdate'))
    return
  }
  await setBpmnRules(rules)
  caseOptionList.value.forEach((item: any) => {
    item.formProperty = item.id.toLowerCase()
    handleCaseField(item)
  })

  function getType(type: string) {
    switch (type) {
      case 'timestamp':
      case 'date':
        return 'date'
      case 'boolean':
        return 'boolean'
      case 'bigint':
      case 'decimal':
      case 'number':
        return 'long'
      default:
        return 'text'
    }
  }
}

watch(() => node, async () => {
  await init()
}, {
  immediate: true,
  deep: true
})

onMounted(async () => {
  await getCaseLise()
  await init()
})
</script>

<template>
  <div>
    <BpmnSidebarEditLabel :node="node" />
    <el-form label-position="top" :disabled="editorProvider.readonly.value">
      <el-form-item label="Case" required>
        <el-select v-model="caseTypeId" @change="handleCase" filterable>
          <el-option v-for="item in caseList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Case Return Column ID" required>
        <el-select v-model="caseReturnId" :placeholder="t('common_selectedIsRequiredMsg')"
                   @change="handleCaseReturnId" filterable>
          <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <template v-if="caseOptionList.length > 0">
        <el-divider />
        <el-button size="small" type="primary" @click="importFields">Auto Import</el-button>
        <div v-loading="loading">
          <template v-for="item in caseOptionList" :key="item.id">
            <el-form-item :label="item.name">
              <el-select v-model="item.formProperty" filterable clearable @change="handleCaseField(item)">
                <el-option v-for="field in allFields" :key="field.id" :label="field.name" :value="field.id" />
              </el-select>
            </el-form-item>
          </template>
        </div>
      </template>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
