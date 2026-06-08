<script setup lang="ts">
import { clientApi } from 'api'
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'
const { getVariablesByDisplayTypes } = useVariablesProvide()

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    processDefinitionId: string
    variables: any
  }
}>()
function getVariablesList(displayType: string) {
  return getVariablesByDisplayTypes([displayType], true)
}

const workflowList = await getWorkflowList()

const processDefinitionId = ref<string>('')
const formFields = ref<any[]>([])
const loading = ref(false)

async function initForm() {
  processDefinitionId.value = config.processDefinitionId
  await getWorkflowFormFields(config.variables)
}

function updateData() {
  const variableList = formFields.value.reduce((acc, field) => {
    acc[field.id] = field.value
    return acc
  }, {})

  emits('update', {
    name: 'update-sub-process-data',
    config: {
      ...config,
      processDefinitionId: processDefinitionId.value,
      variables: variableList
    }
  })
}

async function changeProcessDefinitionId() {
  await getWorkflowFormFields({})
  updateData()
}

async function getWorkflowFormFields(variables: any) {
  formFields.value = []
  if (!processDefinitionId.value || processDefinitionId.value === '') return
  try {
    loading.value = true
    const data = await clientApi.instance
      .get(`/oniflow/api/v1/workflow/definitions/instance/${processDefinitionId.value}/content`)
      .then((r: any) => workflowResponseHelper(r))

    const startEventNode = data.nodes.find((node: any) => node.type.type === 'startevent')
    if (!startEventNode) return

    formFields.value = startEventNode.config.initialise.form_fields.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type.type,
      display_type: field.display_type,
      value: variables[field.id] || ''
    }))
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

watch(
  () => config,
  () => {
    initForm()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top">
    <el-form-item :label="t('Process Definition')">
      <el-select v-model="processDefinitionId" :placeholder="t('common_selectedIsRequiredMsg')" @change="changeProcessDefinitionId">
        <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />
    <span>Variables</span>
    <template v-loading="loading" v-for="field in formFields" :key="field.id">
      <el-form-item :label="field.name">
        <el-select v-model="field.value" filterable @change="updateData">
          <el-option v-for="item in getVariablesList(field.display_type)" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss"></style>
