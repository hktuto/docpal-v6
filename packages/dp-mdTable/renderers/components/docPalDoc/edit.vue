<script setup lang="ts">
import { Delete, EditPen } from '@element-plus/icons-vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { DocPalDocCellValue } from '../../../types/column-types'
import DocPalDocBrowsePicker from './browsePicker.vue'

const props = defineProps<{
  row: Record<string, unknown>
  column: { field: string }
  onMouseenter?: (e: MouseEvent) => void
  onMouseleave?: (e: MouseEvent) => void
}>()

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey, null)

const pickerVisible = ref(false)
const editDialogVisible = ref(false)
const editingDocId = ref('')
const draftDocName = ref('')

function getDocs(): DocPalDocCellValue[] {
  const raw = props.row[props.column.field]
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((item): item is DocPalDocCellValue => Boolean(item?.id))
  }
  const single = raw as DocPalDocCellValue
  return single?.id ? [single] : []
}

function setDocs(docs: DocPalDocCellValue[]) {
  props.row[props.column.field] = docs
}

const docs = computed(() => getDocs())

function handleOpenDocument(doc: DocPalDocCellValue, e: MouseEvent | KeyboardEvent) {
  e.stopPropagation()
  if (!routerProvider) return
  routerProvider.navigateTo(
    createDetailPageParams({
      idOrPath: doc.id,
      docName: doc.name || doc.id
    }),
    true
  )
}

function handleOpenPicker() {
  pickerVisible.value = true
}

function handleEditDocument(doc: DocPalDocCellValue, e: MouseEvent | KeyboardEvent) {
  e.stopPropagation()
  editingDocId.value = doc.id
  draftDocName.value = doc.name || ''
  editDialogVisible.value = true
}

function handleRemoveDocument(docId: string, e: MouseEvent | KeyboardEvent) {
  e.stopPropagation()
  setDocs(docs.value.filter((doc) => doc.id !== docId))
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
    return {
      ...doc,
      name: updatedName
    }
  })
  setDocs(nextDocs)
  handleCancelEdit()
}

function handleClear() {
  setDocs([])
}

function handleAddDocs(newDocs: DocPalDocCellValue[]) {
  if (!newDocs.length) return
  const existingIds = new Set(docs.value.map((d) => d.id))
  const merged = [...docs.value]
  for (const doc of newDocs) {
    if (!existingIds.has(doc.id)) {
      merged.push(doc)
      existingIds.add(doc.id)
    }
  }
  setDocs(merged)
}
</script>

<template>
  <div class="docpal-doc-edit-cell vxe-cell-absolute" @mouseenter="onMouseenter" @mouseleave="onMouseleave">
    <div class="docpal-doc-edit-cell__list">
      <div v-for="doc in docs" :key="doc.id" class="docpal-doc-edit-cell__item">
        <div style="display: flex; align-items: center">
          <img v-if="doc.mimeType" class="docpal-doc-edit-cell__file-icon" :src="mimeTypeToIcon(doc.mimeType)" alt="" aria-hidden="true" />
          <a
            class="docpal-doc-edit-cell__link"
            tabindex="0"
            role="link"
            :aria-label="doc.name || doc.id"
            @click="handleOpenDocument(doc, $event)"
            @keydown.enter="handleOpenDocument(doc, $event)"
          >
            {{ doc.name || doc.id }}
          </a>
        </div>
        <div>
          <ElIcon
            class="docpal-doc-edit-cell__delete-icon vxe-table--ignore-clear el-icon--left"
            tabindex="0"
            role="button"
            :aria-label="t('common_delete')"
            @click.stop="handleRemoveDocument(doc.id, $event)"
            @keydown.enter.stop="handleRemoveDocument(doc.id, $event)"
          >
            <Delete />
          </ElIcon>
          <ElIcon
            class="docpal-doc-edit-cell__edit-icon vxe-table--ignore-clear"
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
      <span v-if="!docs.length" class="docpal-doc-edit-cell__placeholder">{{ t('editor.docPalDoc.selectPlaceholder') }}</span>
    </div>
    <div class="docpal-doc-edit-cell__actions">
      <ElButton
        v-if="docs.length"
        class="vxe-table--ignore-clear"
        size="small"
        tabindex="0"
        :aria-label="t('common_clear')"
        @click.stop="handleClear"
        @keydown.enter.stop="handleClear"
      >
        {{ t('common_clear') }}
      </ElButton>
      <ElButton
        class="vxe-table--ignore-clear"
        type="primary"
        size="small"
        tabindex="0"
        :aria-label="t('Add')"
        @click.stop="handleOpenPicker"
        @keydown.enter.stop="handleOpenPicker"
      >
        {{ t('Add') }}
      </ElButton>
    </div>
    <DocPalDocBrowsePicker v-model:visible="pickerVisible" @add="handleAddDocs" />
    <ElDialog v-model="editDialogVisible" append-to-body width="420px" class="vxe-table--ignore-clear" :title="t('common_title')" @click.stop>
      <ElInput v-model="draftDocName" clearable />
      <template #footer>
        <ElButton @click="handleCancelEdit">{{ t('cancelText') }}</ElButton>
        <ElButton type="primary" @click="handleConfirmEdit">{{ t('confirm') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.docpal-doc-edit-cell {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  width: 100%;
  min-height: 100%;
  min-width: 0;
  padding: var(--app-space-xs);
  box-sizing: border-box;
  background: var(--el-bg-color);
  border: 1px solid var(--app-primary-color);
}

.docpal-doc-edit-cell__list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  min-width: 0;
}

.docpal-doc-edit-cell__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.docpal-doc-edit-cell__link {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--app-font-size-s);
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

.docpal-doc-edit-cell__file-icon {
  width: var(--app-space-m);
  height: var(--app-space-m);

  flex-shrink: 0;
}

.docpal-doc-edit-cell__edit-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);

  &:hover {
    color: var(--el-color-primary);
  }
}

.docpal-doc-edit-cell__delete-icon {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);

  &:hover {
    color: var(--el-color-danger);
  }
}

.docpal-doc-edit-cell__placeholder {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
}

.docpal-doc-edit-cell__actions {
  display: flex;
  gap: var(--app-space-xs);
  flex-shrink: 0;
  margin-top: var(--app-space-xs);
}
</style>
