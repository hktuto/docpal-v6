<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { AttachmentCellValue } from '../../../types/column-types'
import { resolveColumnDataField } from '../../../utils/fieldValueFormat'
import AttachmentUpload from '../../mdForm/field/Attachment/upload.vue'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const { t } = useI18n()
const tableDataContext = useTableDataInject({ required: false })
const dialogVisible = ref(false)
const modelField = computed(() => resolveColumnDataField(props.field, 'field_name'))

function applyAttachments(nextAttachments: AttachmentCellValue[]) {
  if (!modelField.value) return

  props.row[modelField.value] = nextAttachments

  if (tableDataContext?.updateRow && props.row?.id) {
    tableDataContext.updateRow(props.row.id, {
      [modelField.value]: nextAttachments
    })
  }
}

const attachments = computed({
  get: () => {
    if (!modelField.value) return []
    return (props.row?.[modelField.value] ?? []) as AttachmentCellValue[]
  },
  set: applyAttachments
})

function handleOpenDialog(e?: MouseEvent | KeyboardEvent) {
  e?.stopPropagation()
  dialogVisible.value = true
}
</script>

<template>
  <div class="attachment-card-widget field-value" @click.stop>
    <div
      class="attachment-card-widget__list"
      tabindex="0"
      :aria-label="t('mdTable.attachment.listTitle')"
      @click.stop="handleOpenDialog"
      @keydown.enter.stop.prevent="handleOpenDialog"
    >
      <img
        v-for="attachment in attachments"
        :key="attachment.id"
        class="attachment-card-widget__file-icon"
        :src="mimeTypeToIcon(attachment.mime_type)"
        :title="attachment.file_name"
        alt=""
        aria-hidden="true"
      />
      <span v-if="!attachments.length" class="attachment-card-widget__empty">--</span>
    </div>

    <ElDialog v-model="dialogVisible" append-to-body width="700px" :title="t('mdTable.attachment.listTitle')" @click.stop>
      <AttachmentUpload v-if="modelField" v-model="attachments" :data-id="row.id" :field-name="modelField" />
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.attachment-card-widget {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  min-width: 0;
}

.attachment-card-widget__add {
  flex-shrink: 0;
}

.attachment-card-widget__list {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  min-width: 0;
  overflow: hidden;
  outline: none;
  cursor: pointer;
}

.attachment-card-widget__file-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  object-fit: contain;
}

.attachment-card-widget__empty {
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}
</style>
