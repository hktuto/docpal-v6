<template>
  <div class="variable-manager">
    <div class="header">
      <h2>Variables</h2>
      <el-button type="primary" @click="handleOpenCreate" v-tooltip="'Create new variable'">New Variable</el-button>
    </div>
    <el-table :data="docTemplateCtx.variables.value" :key="renderKey + '_' + docTemplateCtx.variables.value.length" height="400">
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="type" label="Type" />
      <el-table-column prop="displayValue" label="Display Value" />
      <el-table-column label="Actions">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)" v-tooltip="'Edit variable'">Edit</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)" v-tooltip="'Delete variable'" :disabled="editorUse(row.id)">Delete </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="showForm" :title="formMode === 'create' ? 'Create Variable' : 'Edit Variable'" class="big" destroy-on-close>
      <VariableForm
        v-if="showForm"
        :mode="formMode"
        :variable="selectedVariable"
        :variables="docTemplateCtx.variables"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import VariableForm from './variableForm.vue'
import { DocTemplateProveKey } from '../../../../../utils/docTemplateHelper'
import type { DocTemplateVariable } from '../../../../../utils/docTemplateHelper'

const docTemplateCtx = inject(DocTemplateProveKey)
if (!docTemplateCtx) {
  throw new Error('DocTemplateContext not found')
}

// force re-render the table when the variables are updated
const renderKey = ref(0)

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedVariable = ref<DocTemplateVariable | null>(null)

function handleOpenCreate() {
  formMode.value = 'create'
  selectedVariable.value = null
  showForm.value = true
}

function handleEdit(variable: DocTemplateVariable) {
  formMode.value = 'edit'
  selectedVariable.value = { ...variable }
  showForm.value = true
  renderKey.value++
}

function handleDelete(variable: DocTemplateVariable) {
  if ('inUse' in variable && variable.inUse) return
  docTemplateCtx?.removeVariable?.({ ...variable })
  renderKey.value++
}

function handleFormSubmit(payload: { mode: 'create' | 'edit'; variable: any }) {
  if (payload.mode === 'create') {
    docTemplateCtx?.addVariable?.({ ...payload.variable })
  } else {
    docTemplateCtx?.updateVariable?.({ ...payload.variable })
  }
  renderKey.value++
  showForm.value = false
}

function handleFormCancel() {
  showForm.value = false
}

function editorUse(id) {
  if (!id) return false
  let editorJson = docTemplateCtx.editor.value.getJSON()
  if (!editorJson) return false
  // Check if the id exists
  return checkIdIsExists(editorJson, id)
}

function checkIdIsExists(item: any, id: string) {
  try {
    const st = JSON.stringify(item)
    return st.includes(id)
  } catch (e) {
    return false
  }
}
</script>

<style lang="scss" scoped>
.variable-manager {
  padding: 1rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
}
</style>
