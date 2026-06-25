<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { AttachmentCellValue } from '../../../types/column-types'
import AttachmentUpload from '../../../components/mdForm/field/Attachment/upload.vue'
import { normalizeAttachmentValue } from './view'

const props = defineProps<{
  modelValue: unknown
  row: Record<string, any>
  column: { field: string }
  onMouseenter?: (e: MouseEvent) => void
  onMouseleave?: (e: MouseEvent) => void
}>()

const { t } = useI18n()
const mdTableContext = useTableDataInject()
const dialogVisible = ref(false)

const attachments = computed(() => normalizeAttachmentValue(props.row[props.column.field] ?? props.modelValue))

function setAttachments(nextAttachments: AttachmentCellValue[]) {
  props.row[props.column.field] = nextAttachments
  const params = {
    [props.column.field]: nextAttachments
  }
  if (mdTableContext.updateRow && props.row?.id) {
    mdTableContext.updateRow(props.row.id, params)
  }
}

function handleOpenDialog(e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  dialogVisible.value = true
}
</script>

<template>
  <div class="attachment-edit-cell vxe-cell-absolute" @mouseenter="onMouseenter" @mouseleave="onMouseleave" @click.stop>
    <ElButton
      class="attachment-edit-cell__add vxe-table--ignore-clear"
      :icon="Plus"
      circle
      size="small"
      :aria-label="t('mdTable.attachment.add')"
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

    <ElDialog
      v-model="dialogVisible"
      append-to-body
      width="700px"
      class="attachment-dialog vxe-table--ignore-clear"
      :title="t('mdTable.attachment.listTitle')"
      @click.stop
    >
      <AttachmentUpload
        :model-value="attachments"
        :data-id="row.id"
        :field-name="column.field"
        ignore-clear
        @update:model-value="setAttachments"
      />
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
</style>
