<script setup lang="ts">
import { Delete, Download, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { clientApi } from 'api'
import { formatFileSize, mimeTypeToIcon } from '../../../../../base/utils/browseHelper'
import { downloadBlob } from '../../../../../base/utils/globalHelper'
import type { AttachmentCellValue } from '../../../../types/column-types'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    dataId?: string
    fieldName: string
    disabled?: boolean
    showUpload?: boolean
    uploadDisabled?: boolean
    uploadHint?: string
    ignoreClear?: boolean
    mode?: 'default' | 'form'
  }>(),
  {
    disabled: false,
    showUpload: true,
    uploadDisabled: false,
    ignoreClear: false,
    mode: 'default'
  }
)

const attachments = defineModel<AttachmentCellValue[]>({ default: () => [] })

const uploadingCount = ref(0)
const deletingAttachmentId = ref<string | null>(null)
const downloadingAttachmentId = ref<string | null>(null)
const previewingAttachmentId = ref<string | null>(null)
const readerDialogRef = ref<{ handleOpen: () => void; handleClose: () => void }>()
let uploadQueue = Promise.resolve()
const previewFile = reactive({
  blob: null as Blob | null,
  name: '',
  id: '',
  loading: false,
  options: {
    noDownload: true,
    print: false,
    loadAnnotations: false,
    readOnly: true
  }
})

const uploading = computed(() => uploadingCount.value > 0)
const isFormMode = computed(() => props.mode === 'form')
const uploadText = computed(() => props.uploadHint ?? t('mdTable.attachment.dragOrClickToUpload'))
const buttonClass = computed(() => (props.ignoreClear ? 'vxe-table--ignore-clear' : undefined))

function mergeAttachments(current: AttachmentCellValue[], incoming: AttachmentCellValue[]) {
  const merged = [...current]
  for (const attachment of incoming) {
    const index = merged.findIndex((item) => item.id === attachment.id)
    if (index >= 0) {
      merged[index] = attachment
    } else {
      merged.push(attachment)
    }
  }
  return merged
}

async function uploadAttachment(rawFile: File, dataId: string, fieldName: string) {
  try {
    const response = await clientApi.api.postDynamicDbTableDataDataidAttachments(dataId, {}, { file: rawFile, field_name: fieldName })
    const payload = (response as { data?: unknown })?.data ?? response
    attachments.value = mergeAttachments(attachments.value, toAttachmentList(payload))
    if (!isFormMode.value) {
      ElMessage.success(t('mdTable.attachment.uploadSuccess'))
    }
  } catch {
    ElMessage.error(t('mdTable.attachment.uploadFailed'))
  }
}

function isDeleting(attachmentId: string) {
  return deletingAttachmentId.value === attachmentId
}

function isDownloading(attachmentId: string) {
  return downloadingAttachmentId.value === attachmentId
}

function isPreviewing(attachmentId: string) {
  return previewingAttachmentId.value === attachmentId
}

const isAttachmentBusy = computed(() => !!deletingAttachmentId.value || !!downloadingAttachmentId.value || !!previewingAttachmentId.value)

function formatAttachmentSize(size?: number) {
  return size ? formatFileSize(size) : '0 B'
}

function toAttachmentList(payload: unknown): AttachmentCellValue[] {
  if (!payload) return []
  return (Array.isArray(payload) ? payload : [payload]) as AttachmentCellValue[]
}

function handleUploadChange(file: UploadFile) {
  if (!file.raw || !props.fieldName) return
  if (!props.dataId) {
    ElMessage.warning(t('mdTable.attachment.saveBeforeUpload'))
    return
  }

  const rawFile = file.raw
  const dataId = props.dataId
  const fieldName = props.fieldName

  uploadingCount.value += 1
  uploadQueue = uploadQueue
    .then(() => uploadAttachment(rawFile, dataId, fieldName))
    .finally(() => {
      uploadingCount.value -= 1
    })
}

async function handlePreviewAttachment(attachment: AttachmentCellValue, e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  if (!props.dataId || !attachment.id || isPreviewing(attachment.id)) return

  previewingAttachmentId.value = attachment.id
  previewFile.loading = true
  previewFile.name = attachment.file_name
  previewFile.id = attachment.id
  previewFile.blob = null
  readerDialogRef.value?.handleOpen()

  try {
    const blob = await clientApi.api.getDynamicDbTableDataDataidAttachmentsAttachmentidDownload(
      props.dataId,
      attachment.id,
      { field_name: props.fieldName, mode: 'preview' },
      { format: 'blob' }
    )
    previewFile.blob = blob.type ? blob : new Blob([blob], { type: attachment.mime_type })
  } catch {
    ElMessage.error(t('mdTable.attachment.previewFailed'))
    readerDialogRef.value?.handleClose()
  } finally {
    previewFile.loading = false
    previewingAttachmentId.value = null
  }
}

async function handleDownloadAttachment(attachment: AttachmentCellValue, e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  if (!props.dataId || !attachment.id || isDownloading(attachment.id)) return

  downloadingAttachmentId.value = attachment.id
  try {
    const blob = await clientApi.api.getDynamicDbTableDataDataidAttachmentsAttachmentidDownload(
      props.dataId,
      attachment.id,
      { field_name: props.fieldName, mode: 'download' },
      { format: 'blob' }
    )
    downloadBlob(blob, attachment.file_name)
  } catch {
    ElMessage.error(t('mdTable.attachment.downloadFailed'))
  } finally {
    downloadingAttachmentId.value = null
  }
}

async function handleDeleteAttachment(attachment: AttachmentCellValue, e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  if (!props.fieldName || isDeleting(attachment.id)) return

  if (isFormMode.value) {
    attachments.value = attachments.value.filter((item) => item.id !== attachment.id)
    return
  }

  if (!props.dataId) return

  try {
    await ElMessageBox.confirm(t('mdTable.attachment.deleteConfirm', { fileName: attachment.file_name }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      customClass: props.ignoreClear ? 'vxe-table--ignore-clear' : undefined,
      modalClass: props.ignoreClear ? 'vxe-table--ignore-clear' : undefined,
    })
  } catch {
    return
  }
  deletingAttachmentId.value = attachment.id
  try {
    await clientApi.api.deleteDynamicDbTableDataDataidAttachmentsAttachmentid(
      props.dataId,
      attachment.id,
      {
        field_name: props.fieldName
      },
      {
        headers: {
          noThrowError: 'true'
        }
      }
    )
  } catch {
  } finally {
    attachments.value = attachments.value.filter((item) => item.id !== attachment.id)
    ElMessage.success(t('mdTable.attachment.deleteSuccess'))
    deletingAttachmentId.value = null
  }
}
</script>

<template>
  <div class="attachment-upload" v-loading="uploading">
    <ElUpload
      v-if="showUpload && !disabled"
      class="attachment-upload__dropzone"
      :class="{ 'attachment-upload__dropzone--form': isFormMode }"
      :drag="!isFormMode"
      multiple
      :auto-upload="false"
      :show-file-list="false"
      :disabled="uploadDisabled || uploading"
      :on-change="handleUploadChange"
    >
      <ElButton v-if="isFormMode" type="primary" :disabled="uploadDisabled || uploading">
        {{ t('common_clickToUpload') }}
      </ElButton>
      <div v-else class="attachment-upload__dropzone-text">{{ uploadText }}</div>
    </ElUpload>

    <div v-if="attachments.length" class="attachment-upload__list">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="attachment-upload__item"
        v-loading="isDeleting(attachment.id) || isDownloading(attachment.id) || isPreviewing(attachment.id)"
      >
        <img class="attachment-upload__file-icon" :src="mimeTypeToIcon(attachment.mime_type)" alt="" aria-hidden="true" />
        <div class="attachment-upload__file-info">
          <span class="attachment-upload__file-name" v-tooltip="attachment.file_name">{{ attachment.file_name }}</span>
          <span class="attachment-upload__file-size">{{ formatAttachmentSize(attachment.size) }}</span>
        </div>
        <div class="attachment-upload__actions">
          <ElButton
            v-if="!disabled"
            :class="buttonClass"
            link
            type="danger"
            :icon="Delete"
            :loading="isDeleting(attachment.id)"
            :disabled="isAttachmentBusy || uploading"
            :aria-label="t('mdTable.attachment.delete')"
            @click.stop="handleDeleteAttachment(attachment, $event)"
            @keydown.enter.stop="handleDeleteAttachment(attachment, $event)"
          />
          <ElButton
            :class="buttonClass"
            link
            type="primary"
            :icon="View"
            :loading="isPreviewing(attachment.id)"
            :disabled="isAttachmentBusy || uploading"
            :aria-label="t('mdTable.attachment.preview')"
            @click.stop="handlePreviewAttachment(attachment, $event)"
            @keydown.enter.stop="handlePreviewAttachment(attachment, $event)"
          />
          <ElButton
            :class="buttonClass"
            link
            type="primary"
            :icon="Download"
            :loading="isDownloading(attachment.id)"
            :disabled="isAttachmentBusy || uploading"
            :aria-label="t('mdTable.attachment.download')"
            @click.stop="handleDownloadAttachment(attachment, $event)"
            @keydown.enter.stop="handleDownloadAttachment(attachment, $event)"
          />
        </div>
      </div>
    </div>
    <ElEmpty v-else-if="!isFormMode" :description="t('mdTable.attachment.noAttachments')" />
    <ReaderDialog ref="readerDialogRef" v-bind="previewFile" :collabora="false" :options="previewFile.options" />
  </div>
</template>

<style scoped lang="scss">
.attachment-upload {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.attachment-upload__dropzone {
  width: 100%;
}

.attachment-upload__dropzone--form {
  width: auto;
}

.attachment-upload__dropzone-text {
  color: var(--app-text-color-placeholder);
}

.attachment-upload__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--app-space-s);
}

.attachment-upload__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  min-width: 0;
  padding: var(--app-space-s);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-s);

  // &:hover .attachment-upload__actions,
  // &:focus-within .attachment-upload__actions {
  //   opacity: 1;
  //   visibility: visible;
  //   transform: translateY(0);
  //   box-shadow: 0 6px 16px rgb(0 0 0 / 22%);
  // }
}

.attachment-upload__file-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.attachment-upload__file-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.attachment-upload__file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-upload__file-size {
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.attachment-upload__actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  width: 100%;
  padding: var(--app-space-xxs);
  border-radius: var(--app-border-radius-s) var(--app-border-radius-s) 0 0;
  background: rgb(0 0 0 / 42%);
  backdrop-filter: blur(8px) saturate(1.1);
  box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  transform: translateY(-4px);
  opacity: 1;
  visibility: visible;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  :deep(.el-button) {
    padding: 0;
    margin: 0;
    height: auto;
    color: var(--el-color-white);
  }

  :deep(.el-button.is-disabled) {
    color: rgb(255 255 255 / 45%);
  }

  :deep(.el-button--danger:not(.is-disabled)) {
    color: var(--el-color-danger-light-3);
  }

  :deep(.el-button + .el-button) {
    margin-left: var(--app-space-xxs);
  }
}
</style>
