<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { formatFileSize, mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { AttachmentCellValue } from '../../../types/column-types'
import { useTableDataInject } from '../../../composables/useTableData'
import { deleteTableAttachment, uploadTableAttachment } from './api'
import { normalizeAttachmentValue } from './view'

const props = defineProps<{
  modelValue: unknown
  row: Record<string, any>
  column: { field: string }
  onMouseenter?: (e: MouseEvent) => void
  onMouseleave?: (e: MouseEvent) => void
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: AttachmentCellValue[]): void
}>()

const tableDataContext = useTableDataInject({ required: false })
const dialogVisible = ref(false)
const uploadingCount = ref(0)
const deletingIds = ref<Set<string>>(new Set())

const attachments = computed(() => normalizeAttachmentValue(props.row[props.column.field] ?? props.modelValue))
const uploading = computed(() => uploadingCount.value > 0)
const totalSize = computed(() => attachments.value.reduce((sum, attachment) => sum + (attachment.size || 0), 0))

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

function setDeleting(attachmentId: string, deleting: boolean) {
  const next = new Set(deletingIds.value)
  if (deleting) {
    next.add(attachmentId)
  } else {
    next.delete(attachmentId)
  }
  deletingIds.value = next
}

async function persistAttachments(nextAttachments: AttachmentCellValue[], previousAttachments: AttachmentCellValue[]) {
  props.row[props.column.field] = nextAttachments
  emit('update:modelValue', nextAttachments)

  if (!props.row.id || !tableDataContext?.updateRow) return

  const saved = await tableDataContext.updateRow(props.row.id, {
    [props.column.field]: nextAttachments
  })
  if (saved === false) {
    props.row[props.column.field] = previousAttachments
    emit('update:modelValue', previousAttachments)
    throw new Error('save attachment failed')
  }
}

async function uploadAttachment(file: File) {
  const uploadedAttachments = await uploadTableAttachment(props.row.id, props.column.field, file)
  if (!uploadedAttachments.length) {
    throw new Error('empty upload response')
  }
  return uploadedAttachments
}

function handleOpenDialog(e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  dialogVisible.value = true
}

async function handleUploadChange(file: UploadFile) {
  if (!file.raw || !props.row.id) {
    ElMessage.error('附件上传失败')
    return
  }

  uploadingCount.value += 1
  try {
    const previousAttachments = attachments.value
    const uploadedAttachments = await uploadAttachment(file.raw)
    const nextAttachments = mergeAttachments(attachments.value, uploadedAttachments)
    await persistAttachments(nextAttachments, previousAttachments)
    ElMessage.success('附件上传成功')
  } catch {
    ElMessage.error('附件上传失败')
  } finally {
    uploadingCount.value -= 1
  }
}

async function handleDeleteAttachment(attachment: AttachmentCellValue, e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  if (!props.row.id || !attachment.id || deletingIds.value.has(attachment.id)) return

  const previousAttachments = attachments.value
  const nextAttachments = previousAttachments.filter((item) => item.id !== attachment.id)
  setDeleting(attachment.id, true)
  try {
    await deleteTableAttachment(props.row.id, attachment.id)
    await persistAttachments(nextAttachments, previousAttachments)
    ElMessage.success('附件已删除')
  } catch {
    ElMessage.error('附件删除失败')
  } finally {
    setDeleting(attachment.id, false)
  }
}

function formatAttachmentSize(size?: number) {
  return size ? formatFileSize(size) : '0 B'
}
</script>

<template>
  <div class="attachment-edit-cell vxe-cell-absolute" @mouseenter="onMouseenter" @mouseleave="onMouseleave" @click.stop>
    <ElButton
      class="attachment-edit-cell__add vxe-table--ignore-clear"
      :icon="Plus"
      circle
      size="small"
      aria-label="添加附件"
      @click.stop="handleOpenDialog"
      @keydown.enter.stop="handleOpenDialog"
    />
    <div class="attachment-edit-cell__list">
      <img
        v-for="attachment in attachments"
        :key="attachment.id"
        class="attachment-edit-cell__file-icon"
        :src="mimeTypeToIcon(attachment.mime_type)"
        :title="attachment.file_name"
        alt=""
        aria-hidden="true"
      />
    </div>

    <ElDialog v-model="dialogVisible" append-to-body width="700px" class="attachment-dialog vxe-table--ignore-clear" title="附件列表" @click.stop>
      <div class="attachment-dialog__body" v-loading="uploading">
        <ElUpload class="attachment-dialog__upload" drag multiple :auto-upload="false" :show-file-list="false" :on-change="handleUploadChange">
          <div class="attachment-dialog__upload-text">将文件拖拽或点击此处进行上传</div>
        </ElUpload>

        <div v-if="attachments.length" class="attachment-dialog__list">
          <div v-for="attachment in attachments" :key="attachment.id" class="attachment-dialog__item">
            <img class="attachment-dialog__file-icon" :src="mimeTypeToIcon(attachment.mime_type)" alt="" aria-hidden="true" />
            <div class="attachment-dialog__file-info">
              <span class="attachment-dialog__file-name">{{ attachment.file_name }}</span>
              <span class="attachment-dialog__file-size">{{ formatAttachmentSize(attachment.size) }}</span>
            </div>
            <ElButton
              class="vxe-table--ignore-clear"
              link
              type="danger"
              :icon="Delete"
              :loading="deletingIds.has(attachment.id)"
              aria-label="删除附件"
              @click.stop="handleDeleteAttachment(attachment, $event)"
              @keydown.enter.stop="handleDeleteAttachment(attachment, $event)"
            />
          </div>
        </div>
        <ElEmpty v-else description="暂无附件" />
      </div>
      <template #footer>
        <div class="attachment-dialog__footer">
          <span>附件容量：{{ formatAttachmentSize(totalSize) }}</span>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.attachment-edit-cell {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0 var(--app-space-xs);
  box-sizing: border-box;
  background: var(--el-bg-color);
  border: 1px solid var(--app-primary-color);
}

.attachment-edit-cell__add {
  flex-shrink: 0;
}

.attachment-edit-cell__list {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  min-width: 0;
  overflow: hidden;
}

.attachment-edit-cell__file-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  object-fit: contain;
}

.attachment-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.attachment-dialog__upload {
  width: 100%;
}

.attachment-dialog__upload-text {
  color: var(--app-text-color-placeholder);
}

.attachment-dialog__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--app-space-s);
}

.attachment-dialog__item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  min-width: 0;
  padding: var(--app-space-s);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-s);
}

.attachment-dialog__file-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  object-fit: contain;
}

.attachment-dialog__file-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.attachment-dialog__file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-dialog__file-size {
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.attachment-dialog__footer {
  display: flex;
  justify-content: flex-start;
  color: var(--app-text-color-secondary);
}
</style>
