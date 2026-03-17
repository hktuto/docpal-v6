<script lang="ts" setup>
import { useBatchDetailContext, useScanClient } from '#imports'
import { clientApi } from 'api'

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const {
  documentLoading,
  sectionsWithValues,
  updateFieldValue,
  addTableRow,
  saveDraft,
  confirm,
  currentSelectedDoc,
  projectId,
  reload,
  isLockedByOther,
  lockedByUser
} = context

const routerProvider = inject(MenuRouterKey)

// Check user permissions
const { isVerifier } = useScanClient()
const canVerify = computed(() => isVerifier(projectId.value))

// Check if form should be readonly (locked by other or no verifier permission)
const isReadonly = computed(() => isLockedByOther.value || !canVerify.value)

// Get lock message
const lockMessage = computed(() => {
  if (isLockedByOther.value && lockedByUser.value) {
    return `This batch is currently being edited by ${lockedByUser.value}`
  }
  return ''
})

// Check if current document has error status
const hasError = computed(() => {
  const status = currentSelectedDoc.value?.status
  return status?.includes('fail') || status === 'error'
})

// Get error message from document
const errorMessage = computed(() => {
  return currentSelectedDoc.value?.errorMessage || 'PDF file error, please replace the file and retry'
})

// Loading states for buttons
const savingDraft = ref(false)
const confirming = ref(false)
const uploading = ref(false)

// File input ref
const fileInputRef = ref<HTMLInputElement>()

// Update field value handler
function handleFieldChange(sectionId: string, fieldKey: string, value: any, rowIndex?: number) {
  updateFieldValue(sectionId, fieldKey, value, rowIndex)
}

// Add row handler
function handleAddRow(sectionId: string) {
  addTableRow(sectionId)
}

// Save draft handler
async function handleSaveDraft() {
  savingDraft.value = true
  try {
    await saveDraft()
    routerProvider?.message.success('Draft saved successfully')
  } catch (error) {
    routerProvider?.message.error('Failed to save draft')
  } finally {
    savingDraft.value = false
  }
}

// Confirm handler
async function handleConfirm() {
  confirming.value = true
  try {
    await confirm()
    routerProvider?.message.success('Document confirmed successfully')
  } catch (error) {
    routerProvider?.message.error('Failed to confirm document')
  } finally {
    confirming.value = false
  }
}

// Trigger file input click
function triggerFileUpload() {
  fileInputRef.value?.click()
}

// Handle file upload for replace and retry
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !currentSelectedDoc.value) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    await clientApi.api.postCaptureBatchBatchidDocDocidReplaceAndRetry(
      currentBatchId.value,
      currentSelectedDoc.value.id,
      formData
    )

    routerProvider?.message.success('File replaced successfully')
    // Reload the batch to get updated data
    await reload()
  } catch (error) {
    console.error('Failed to replace file:', error)
    routerProvider?.message.error('Failed to replace file')
  } finally {
    uploading.value = false
    // Clear the input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// Copy error to clipboard
function copyError() {
  const error = errorMessage.value
  navigator.clipboard.writeText(error).then(() => {
    routerProvider?.message.success('Error copied to clipboard')
  }).catch(() => {
    routerProvider?.message.error('Failed to copy error')
  })
}
</script>

<template>
  <div v-loading="documentLoading || uploading" class="formDetailContainer">
    <!-- Error State -->
    <div v-if="hasError" class="errorContainer">
      <div class="errorContent">
        <div class="errorTitle">
          <Icon name="lucide:file-x" class="errorIcon" />
          File Error:
        </div>
        <div class="errorMessage">{{ errorMessage }}</div>
        <ElButton type="primary" @click="triggerFileUpload">
          <Icon name="lucide:upload" />
          Upload File
        </ElButton>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.tiff"
          style="display: none"
          @change="handleFileUpload"
        />
      </div>
      <ElButton type="text" class="copyErrorBtn" @click="copyError">
        Copy Error
      </ElButton>
    </div>

    <!-- Normal Form State -->
    <template v-else>
      <!-- Lock warning banner -->
      <div v-if="isLockedByOther" class="lockWarning">
        <Icon name="lucide:lock" class="lockIcon" />
        <span class="lockText">{{ lockMessage }}</span>
      </div>

      <!-- Scrollable sections list -->
      <div class="sectionsList" :class="{ 'withWarning': isLockedByOther }">
        <ScanBatchDetailSection
          v-for="section in sectionsWithValues"

          :key="section.section_id"
          :section="section"
          :readonly="isReadonly"
          @field-change="handleFieldChange"
          @add-row="handleAddRow"
        />
      </div>

      <!-- Sticky action buttons - only visible to verifiers and not locked -->
      <div v-if="canVerify && !isLockedByOther" class="actionButtons">
        <ElButton
          type="primary"
          size="default"
          :loading="savingDraft"
          :disabled="!currentSelectedDoc"
          @click="handleSaveDraft"
        >
          <Icon name="lucide:save" />
          Save Draft
        </ElButton>
        <ElButton
          type="success"
          size="default"
          :loading="confirming"
          :disabled="!currentSelectedDoc"
          @click="handleConfirm"
        >
          <Icon name="lucide:check-circle" />
          Confirm
        </ElButton>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.formDetailContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  overflow: hidden;
}

.sectionsList {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
  padding: var(--app-space-s);
}

.actionButtons {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background-color: var(--app-bg-color);
  border-top: 1px solid var(--app-border-color);
  flex-shrink: 0;
}

.errorContainer {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  padding: var(--app-space-m);
  gap: var(--app-space-m);
}

.errorContent {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  border: 1px solid var(--app-error-color);
  border-radius: var(--app-radius-m);
  background-color: var(--app-error-color-light, rgba(245, 108, 108, 0.1));
}

.errorTitle {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-weight: 600;
  color: var(--app-error-color);
  font-size: var(--app-font-size-m);
}

.errorIcon {
  font-size: 20px;
}

.errorMessage {
  color: var(--app-text-color-primary);
  font-size: var(--app-font-size-s);
  line-height: 1.5;
}

.copyErrorBtn {
  align-self: flex-end;
}

.lockWarning {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background-color: var(--app-warning-color-light, rgba(230, 162, 60, 0.1));
  border-bottom: 1px solid var(--app-warning-color);
  color: var(--app-warning-color);
  flex-shrink: 0;
}

.lockIcon {
  font-size: 16px;
}

.lockText {
  font-size: var(--app-font-size-s);
}

.sectionsList.withWarning {
  padding-top: var(--app-space-s);
}
</style>
