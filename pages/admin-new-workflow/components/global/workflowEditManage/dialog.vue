<script setup lang="ts">
import json from '../../../public/workflowTemplate.json'
import { clientApi } from 'api'
import { routeWorkflowManageEditor } from '../../../utils/workflowHelper'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const emits = defineEmits(['refresh'])
const formRef = ref()
const openDialog = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  name: '',
  description: '',
  draft_content: {}
})
const userId = useUserId()

function open() {
  formData.value = {
    id: '',
    name: '',
    description: '',
    draft_content: {}
  }
  isEdit.value = false
  openDialog.value = true
}
function edit(row: any) {
  formData.value.id = row.id
  formData.value.description = row.draft_content.description
  formData.value.draft_content = row.draft_content
  isEdit.value = true
  openDialog.value = true
}

const rules = ref([
  { required: true, message: $t('render.hint.fieldRequired', { name: $t('workflow_workflowName') }), trigger: 'change' },
  { validator: checkWorkflowName, trigger: 'blur' }
])

async function checkWorkflowName(rule: any, value: string, callback: any) {
  const data: any = await clientApi.instance.get(`/oniflow/api/v1/workflow/definitions?name=${formData.value.name}`).then((r: any) => r.data.data)
  if (data.length > 0) {
    return callback(new Error(t('There are duplicate names')))
  }
  callback()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()

    // Edit Workflow Info
    if (isEdit.value) {
      const workflowJson = formData.value.draft_content
      workflowJson.description = formData.value.description
      await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${formData.value.id}`, workflowJson).then((res) => res.data)
      emits('refresh')
      return
    }
    const key = formData.value.name.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\s]/g, '')

    // Create Workflow
    const defWorkflowJson = {
      ...json,
      key: `${key}_${Date.now()}`,
      name: formData.value.name,
      description: formData.value.description,
      metadata: {
        ...json.metadata,
        created_date: Date.now(),
        author: useUserId().value
      }
    }
    const data = await clientApi.instance.post('/oniflow/api/v1/workflow/definitions', defWorkflowJson).then((res) => res.data.data)
    if (!data) return

    // set permission
    await clientApi.instance.post(
      '/v2/acl/resource-permissions',
      {
        resourceId: data.id,
        resourceType: 3,
        targetType: 3,
        targetId: 'administrators',
        permissionLevel: 'default'
      },
      {
        baseURL: '/gateway'
      }
    )

    await clientApi.instance.post(
      '/v2/acl/resource-permissions',
      {
        resourceId: data.id,
        resourceType: 3,
        targetType: 1,
        targetId: userId.value,
        permissionLevel: 'default'
      },
      {
        baseURL: '/gateway'
      }
    )

    const workflowEdit = routeWorkflowManageEditor({
      id: data.id,
      name: data.name
    })
    openDialog.value = false
    routerProvider?.navigateTo(workflowEdit)
  } catch (e) {
    console.log(e)
  }
}

defineExpose({ open, edit })
</script>

<template>
  <el-dialog :title="isEdit ? 'Edit Workflow Info' : 'Create Workflow'" v-model="openDialog">
    <el-form :model="formData" ref="formRef" label-position="top">
      <el-form-item v-if="!isEdit" label="Workflow Name" prop="name" :rules="rules">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="Workflow Description" prop="description">
        <el-input v-model="formData.description" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="Workflow__CreateWorkflow__Submit" type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
