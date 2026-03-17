<script setup lang="ts">
import json from '../../../public/workflowTemplate.json'
import { routeWorkflowManageEditor } from '../../../utils/workflowHelper'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const emits = defineEmits(['refresh'])
const elFormRef = ref()
const openDialog = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: '',
  name: '',
  description: '',
  draft_content: {}
})

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

async function handleSubmit() {
  try {
    // Edit Workflow Info
    if (isEdit.valuel) {
      const workflowJson = formData.value.draft_content
      workflowJson.description = formData.value.description
      $api.put(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${formData.value.id}`, workflowJson).then((res) => res.data)
      emits('refresh')
      return
    }

    // Create Workflow
    const defWorkflowJson = {
      ...json,
      key: `${formData.value.name}_${Date.now()}`,
      name: formData.value.name,
      description: formData.value.description
    }
    const data = $api.post('http://192.168.5.147:8080/api/v1/workflow/definitions', defWorkflowJson).then((res) => res.data)
    if (!data) return

    const workflowEdit = routeWorkflowManageEditor({
      id: data.id,
      name: data.name
    })
    routerProvider?.navigateTo(workflowEdit)
  } catch (e) {
    console.log(e)
  } finally {
    openDialog.value = false
  }
}

defineExpose({ open, edit })
</script>

<template>
  <el-dialog :title="isEdit ? 'Edit Workflow Info' : 'Create Workflow'" v-model="openDialog">
    <el-form :model="formData" ref="elFormRef" label-position="top">
      <el-form-item v-if="!isEdit" label="Workflow Name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="Workflow Description">
        <el-input v-model="formData.description" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
