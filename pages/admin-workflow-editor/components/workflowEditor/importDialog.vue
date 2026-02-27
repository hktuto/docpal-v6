<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

type WorkflowPayload = Record<string, unknown>

const dialogVisible = ref(false)
const selectedFileName = ref('')
const fileContent = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const emit = defineEmits<{
  (event: 'submit', payload: WorkflowPayload): void
}>()

defineExpose({
  open
})

function open(): void {
  resetState()
  dialogVisible.value = true
}

function handleClose(): void {
  dialogVisible.value = false
}

function resetState(): void {
  selectedFileName.value = ''
  fileContent.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) {
    resetState()
    return
  }

  const file = target.files[0]
  if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json')) {
    resetState()
    ElMessage.warning('Only JSON files are supported.')
    return
  }

  selectedFileName.value = file.name
  fileContent.value = await file.text()
}

async function handleConfirm(): Promise<void> {
  if (!fileContent.value) {
    ElMessage.warning('Please select a JSON file to import.')
    return
  }

  let parsedPayload: WorkflowPayload
  try {
    parsedPayload = JSON.parse(fileContent.value) as WorkflowPayload
  } catch (error) {
    ElMessage.error('The selected file does not contain valid JSON.')
    return
  }

  try {
    await ElMessageBox.confirm(
      'Importing the workflow will replace the existing data. Do you want to continue?',
      'Replace Existing Workflow?',
      {
        type: 'warning',
        confirmButtonText: 'Import',
        cancelButtonText: 'Cancel'
      }
    )
  } catch {
    return
  }

  emit('submit', parsedPayload)
  dialogVisible.value = false
  resetState()
}
</script>

<template>
  <ElDialog v-model="dialogVisible" width="480px" title="Import Workflow" @closed="resetState">
    <div class="import-dialog">
      <label class="import-dialog__label" for="import-workflow-file">
        Select a workflow JSON file
      </label>

      <input
        id="import-workflow-file"
        ref="fileInputRef"
        class="import-dialog__input"
        type="file"
        accept=".json,application/json"
        tabindex="0"
        aria-label="Choose workflow JSON file to import"
        @change="handleFileChange"
        @keydown.enter.prevent="fileInputRef?.click()"
      >

      <p v-if="selectedFileName" class="import-dialog__file-name">
        Selected file: {{ selectedFileName }}
      </p>
    </div>

    <template #footer>
      <div class="import-dialog__actions">
        <ElButton text @click="handleClose">
          Cancel
        </ElButton>
        <ElButton type="primary" @click="handleConfirm">
          Import
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.import-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__label {
    font-weight: 600;
  }

  &__input {
    padding: 8px;
    border: 1px dashed var(--app-border-color, #dcdfe6);
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    transition: border 0.2s ease;

    &:focus-visible {
      outline: none;
      border-color: var(--app-primary-color, #409eff);
    }
  }

  &__file-name {
    margin: 0;
    font-size: 12px;
    color: var(--app-text-secondary-color, #909399);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>

