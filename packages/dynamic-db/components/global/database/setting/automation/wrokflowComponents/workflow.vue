<script setup lang="ts">
import { clientApi } from 'api'
import { getWorkflowList, workflowResponseHelper } from '#imports'

const { data, tableFields } = defineProps<{
  data: any
  tableFields: any[]
}>()
const routerProvider = inject(MenuRouterKey)
const workflowFormFields = ref<any[]>([])
const workflowList = ref<any[]>([])
const formData = ref<{
  workflow_id: string
  map_workflow_parameters: {}
}>({
  workflow_id: '',
  map_workflow_parameters: {}
})

async function handleChangeWorkflow() {
  try {
    const data = await clientApi.instance
      .get(`/oniflow/api/v1/workflow/definitions/instance/${formData.value.workflow_id}`)
      .then((r: any) => workflowResponseHelper(r))
    if (!data) {
      routerProvider?.message?.error('Failed to get workflow details')
      return
    }
    if (!data.content) {
      routerProvider?.message?.error('Workflow is not activated')
      return
    }

    const startEventNode = data.content?.nodes?.find((item: any) => item.type == 'StartEvent')
    workflowFormFields.value = startEventNode.config?.initialise?.form_fields.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      display_type: field.display_type,
      value: ''
    }))
    data.workflow_id = formData.value.workflow_id
  } catch (e) {
    console.log(e)
  }
}

async function init() {
  formData.value = data
  if (!!formData.value.workflow_id && formData.value.workflow_id !== '') {
    await handleChangeWorkflow()
  }
  workflowFormFields.value = workflowFormFields.value.map((item: any) => {
    const v = data.map_workflow_parameters[item.id]
    return v === undefined ? item : { ...item, value: v }
  })
}

function update() {
  let map_workflow_parameters = {}

  if (formData.value.workflow_id !== '') {
    map_workflow_parameters = workflowFormFields.value.reduce((acc: any, item: any) => {
      acc[item.id] = item.value
      return acc
    }, {})
  }

  data.map_workflow_parameters = map_workflow_parameters
}

onMounted(async () => {
  workflowList.value = await getWorkflowList()
})
watch(() => data, () => {
  if (!data) return
  if (data.workflow_id === formData.value.workflow_id) return
  init()
}, { deep: true, immediate: true })
</script>

<template>
  <label class="field-label">Run workflow</label>
  <el-select v-model="formData.workflow_id" placeholder="Enter workflow ID" size="small" @change="handleChangeWorkflow">
    <el-option v-for="wf in workflowList" :key="wf.id" :label="wf.name" :value="wf.id" />
  </el-select>
  <el-form label-width="auto" size="small">
    <template v-for="formField in workflowFormFields" :key="formField.id">
      <el-form-item :label="formField.name">
        <el-select v-model="formField.value" @change="update">
          <el-option v-for="field in tableFields" :key="field.key" :label="field.name" :value="field.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss">

</style>