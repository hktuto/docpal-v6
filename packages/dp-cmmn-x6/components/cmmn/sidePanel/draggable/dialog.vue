<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('caseManagement_editField') : $t('workflowEditor.addField')"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="CaseManagement__Detail__Information__AddField__Submit" :loading="state.loading" type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { adminApi } from 'api'
import fieldForm from './form/field.vform.json'
import humanTaskFieldsForm from './form/humanTaskFields.vform.json'
import flowableInForm from './form/flowableIn.vform.json'
import flowableOutForm from './form/flowableOut.vform.json'
import sentryForm from './form/sentry.vform.json'

const props = defineProps<{
  formJsonUrl: any
  node: any
  graph: any
  filterList: any
}>()
const emits = defineEmits(['refresh', 'edit', 'create'])
const formJson = computed(() => {
  switch (props.formJsonUrl) {
    case 'field':
      return fieldForm
    case 'humanTaskFields':
      return humanTaskFieldsForm
    case 'flowableIn':
      return flowableInForm
    case 'flowableOut':
      return flowableOutForm
    case 'sentry':
      return sentryForm
    default:
      return {}
  }
})
const { caseId } = useCmmnGraph()
const state = reactive({
  visible: false,
  isEdit: false,
  workflowProperties: []
})
const FormRendererRef = ref()

// const formJson = getJsonApi('admin/adminAclForm.json')
async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (state.isEdit) {
      emits('edit', deepCopy(data))
    } else {
      if(data.name) {
        data.id = data.name.replaceAll(' ', '_') + '_' + new Date().valueOf().toString()
        console.log('data', deepCopy(data))
      }else{
        data.id = new Date().valueOf().toString()
      }
      emits('create', deepCopy(data))
    }
    state.visible = false
  } catch(e) {
    console.log('error', e)
  }
}

function handleOpen(row: any) {
  state.isEdit = !!row
  state.visible = true
  setTimeout(async () => {
    // FormRendererRef.value.vFormRenderRef.setFormJson(formJson)
    FormRendererRef.value.vFormRenderRef.resetForm()
    const idField = FormRendererRef.value.vFormRenderRef.getWidgetRef('id')
    if (!state.isEdit && idField) {
      idField.setRequired(true)
      idField.setHidden(true)
    }
    if (state.isEdit && !!row) await FormRendererRef.value.vFormRenderRef.setFormData({ ...row })
    setFormOptions(row)
  })
}

async function setFormOptions(row: any) {
  let workflowProperties: any = []
  let filterList
  switch (props.formJsonUrl) {
    case 'field':
      setFileterList(row)
      break
    case 'humanTaskFields':
      filterList = setFileterList(row)
      loadCaseInfomationOptions('name', filterList)
      break
    case 'flowableIn':
      const inWorkflowTarget = FormRendererRef.value.vFormRenderRef.getWidgetRef('target')
      workflowProperties = await getWorkflowProperties()
      inWorkflowTarget.loadOptions(workflowProperties)
      filterList = getFilterList(row, 'source')
      loadCaseInfomationOptions('source', filterList, 'source')
      break
    case 'flowableOut':
      const outWorkflowSource = FormRendererRef.value.vFormRenderRef.getWidgetRef('source')
      workflowProperties = await getWorkflowProperties()
      outWorkflowSource.loadOptions(workflowProperties)
      filterList = getFilterList(row, 'target')
      loadCaseInfomationOptions('target', filterList, 'target')
      break
    case 'sentry':
      // filterList = getFilterList(row, 'target')
      loadCaseInfomationOptions('properties')
      break
    default:
      break
  }
}

function getFilterList(row: any = {}, uniqueName: string = 'name') {
  let list
  try {
    if (!!row) list = props.filterList.filter((item) => item[uniqueName] !== row[uniqueName])
    else list = [...props.filterList]
    console.log(list)
  } catch (error) {
    list = []
  }
  return list
}

function setFileterList(row: any, uniqueName: string = 'filterList') {
  const filterList = getFilterList(row)
  const filterListRef = FormRendererRef.value.vFormRenderRef.getWidgetRef(uniqueName)
  filterListRef.loadOptions(filterList)
  return filterList
}

async function loadCaseInfomationOptions(uniqueName: string, filterList: any = null, prop: string = 'id') {
  const widgetRef = FormRendererRef.value.vFormRenderRef.getWidgetRef(uniqueName)
  let caseProperties = await getCaseInformation(props.graph)
  if (!!filterList) {
    caseProperties = caseProperties.filter((item) => !filterList.find((f) => f[prop] === item.value))
  }
  widgetRef.loadOptions(caseProperties)
}

async function getWorkflowProperties() {
  try {
    const workflow = props.node.data.data.processRefExpression.__cdata

    const options = await adminApi.api.postWorkflowProperties({ processKey: workflow })
    return options.map((item) => ({
      label: item.name,
      value: item.id
    }))
  } catch (error) {
    return []
  }
}

function getCaseInformation(graph) {
  try {
    const caseNode = graph.getCellById(caseId.value)
    const casePlanModel = caseNode.data.data.casePlanModel ? caseNode.data.data.casePlanModel : caseNode.data.data.data.casePlanModel
    const field = casePlanModel.extensionElements['docpal:form'][0].field
    return field.map((item) => ({
      ...item,
      label: item.attr_name,
      value: item.attr_id
    }))
  } catch (error) {
    return []
  }
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
