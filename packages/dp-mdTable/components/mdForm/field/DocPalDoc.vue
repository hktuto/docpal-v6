<script setup lang="ts">
import { Delete, EditPen, Plus } from '@element-plus/icons-vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { DocPalDocCellValue } from '../../../types/column-types'
import DocPalDocBrowsePicker from '../../../renderers/components/docPalDoc/browsePicker.vue'

const props = defineProps<{
  formData: Record<string, unknown>
  column: { field_name: string; required?: boolean }
  fieldName: string
  disabled: boolean
}>()

const { t } = useI18n()

const fieldKey = computed(() => props.column[props.fieldName] as string)
const pickerVisible = ref(false)
const editDialogVisible = ref(false)
const editingDocId = ref('')
const draftDocName = ref('')

const rules = computed(() => {
  if (!props.column?.required) return []
  return [{ required: true, message: t('editor.docPalDoc.required'), trigger: 'change' }]
})

const docs = computed(() => {
  const raw = props.formData[fieldKey.value]
  if (!raw) return [] as DocPalDocCellValue[]
  if (Array.isArray(raw)) {
    return raw.filter((item): item is DocPalDocCellValue => Boolean(item?.id))
  }
  const single = raw as DocPalDocCellValue
  return single?.id ? [single] : []
})

function setDocs(nextDocs: DocPalDocCellValue[]) {
  props.formData[fieldKey.value] = nextDocs
}

function getDocIcon(doc: DocPalDocCellValue) {
  return mimeTypeToIcon(doc.mimeType || '')
}

function handleOpenPicker() {
  if (props.disabled) return
  pickerVisible.value = true
}

function handleAddDocs(newDocs: DocPalDocCellValue[]) {
  if (!newDocs.length) return
  const existingIds = new Set(docs.value.map((doc) => doc.id))
  const merged = [...docs.value]
  for (const doc of newDocs) {
    if (!existingIds.has(doc.id)) {
      merged.push(doc)
      existingIds.add(doc.id)
    }
  }
  setDocs(merged)
}

function handleRemoveDocument(docId: string) {
  if (props.disabled) return
  setDocs(docs.value.filter((doc) => doc.id !== docId))
}

function handleEditDocument(doc: DocPalDocCellValue) {
  if (props.disabled) return
  editingDocId.value = doc.id
  draftDocName.value = doc.name || ''
  editDialogVisible.value = true
}

function handleCancelEdit() {
  editDialogVisible.value = false
  editingDocId.value = ''
  draftDocName.value = ''
}

function handleConfirmEdit() {
  if (!editingDocId.value) return
  const updatedName = draftDocName.value.trim() || editingDocId.value
  const nextDocs = docs.value.map((doc) => {
    if (doc.id !== editingDocId.value) return doc
    return { ...doc, name: updatedName }
  })
  setDocs(nextDocs)
  handleCancelEdit()
}
</script>

<template>
  <MdFormItem v-bind="props" :rules="rules">
    <div class="docpal-doc-form-field">
      <div v-for="doc in docs" :key="doc.id" class="docpal-doc-form-field__item">
        <div class="docpal-doc-form-field__content">
          <img class="docpal-doc-form-field__file-icon" :src="getDocIcon(doc)" alt="" aria-hidden="true" />
          <span class="docpal-doc-form-field__name">{{ doc.name || doc.id }}</span>
        </div>
        <div class="docpal-doc-form-field__actions">
          <ElIcon
            class="docpal-doc-form-field__delete-icon vxe-table--ignore-clear el-icon--left"
            tabindex="0"
            role="button"
            :aria-label="t('common_delete')"
            @click.stop="handleRemoveDocument(doc.id, $event)"
            @keydown.enter.stop="handleRemoveDocument(doc.id, $event)"
          >
            <Delete />
          </ElIcon>
          <ElIcon
            class="docpal-doc-form-field__edit-icon vxe-table--ignore-clear"
            tabindex="0"
            role="button"
            :aria-label="t('editor.docPalDoc.select')"
            @click.stop="handleEditDocument(doc, $event)"
            @keydown.enter.stop="handleEditDocument(doc, $event)"
          >
            <EditPen />
          </ElIcon>
        </div>
      </div>
      <div class="docpal-doc-form-field__footer">
        <ElButton type="primary" size="small" :disabled="disabled" :aria-label="t('Add')" @click="handleOpenPicker">
          <ElIcon class="docpal-doc-form-field__add-icon">
            <Plus />
          </ElIcon>
          {{ t('Add') }}
        </ElButton>
      </div>
    </div>
    <DocPalDocBrowsePicker v-model:visible="pickerVisible" @add="handleAddDocs" />
    <ElDialog v-model="editDialogVisible" append-to-body width="420px" :title="t('common_title')">
      <ElInput v-model="draftDocName" clearable />
      <template #footer>
        <ElButton @click="handleCancelEdit">{{ t('cancelText') }}</ElButton>
        <ElButton type="primary" @click="handleConfirmEdit">{{ t('confirm') }}</ElButton>
      </template>
    </ElDialog>
  </MdFormItem>
</template>

<style scoped lang="scss">
.docpal-doc-form-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.docpal-doc-form-field__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-xs);
}

.docpal-doc-form-field__content {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.docpal-doc-form-field__file-icon {
  width: var(--app-space-m);
  height: var(--app-space-m);
  flex-shrink: 0;
}

.docpal-doc-form-field__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docpal-doc-form-field__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.docpal-doc-form-field__delete-icon,
.docpal-doc-form-field__edit-icon {
  cursor: pointer;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.docpal-doc-form-field__delete-icon:hover {
  color: var(--el-color-danger);
}

.docpal-doc-form-field__edit-icon:hover {
  color: var(--el-color-primary);
}

.docpal-doc-form-field__add-icon {
  color: var(--el-color-white);
}

.docpal-doc-form-field__footer {
  width: 100%;
}
</style>
