<script setup lang="ts">
import { routeWorkflowManageEditor } from '../../../utils/workflowHelper'

const elFormRef = ref()
const openDialog = ref(false)
const formData = ref({
  name: '',
  description: '',
  draft_content: {}
})

function open(row: any) {
  formData.value.draft_content = row.draft_content
  openDialog.value = true
}
function handleSubmit() {
  try {
    const defWorkflowJson = {
      ...formData.value.draft_content,
      key: `${formData.value.name}_${Date.now()}`,
      name: formData.value.name,
      description: formData.value.description
    }
    const data = $api.post('https://sit-v3.wclsolution.com/oniflow/api/v1/workflow/definitions', defWorkflowJson).then((res) => res.data)
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

defineExpose({ open })
</script>

<template>
  <el-dialog title="Definitions Workflow Info" v-model="openDialog">
    <el-form :model="formData" ref="elFormRef" label-position="top">
      <el-form-item label="Workflow Name">
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
