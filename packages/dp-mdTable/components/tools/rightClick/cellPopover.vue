<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { MdTableContextKey, type mdTable } from '../../../composables/useMDTable'

interface CellPopoverOption {
  label: string
  icon: string
  onClick: () => Promise<void>
}

const { t } = useI18n()
const mdTableContext = inject<mdTable | null>(MdTableContextKey, null)
const { gridRef, tableData, deleteRow } = useTableDataInject()
const popoverRef = ref()
const selectedRows = ref<Record<string, any>[]>([])
const optionList = ref<CellPopoverOption[]>([])

function open(mouseEvent: MouseEvent, row: any) {
  console.log('open', mouseEvent, row)
  if (!row?.id) {
    return
  }

  selectedRows.value = getSelectedRows()
  if (selectedRows.value.length > 0) {
    const isInSelected = selectedRows.value.some((item) => item.id === row.id)
    if (!isInSelected) {
      mdTableContext?.clearCheckboxRow()
      return
    }
  }

  popoverRef.value.open(mouseEvent)
  optionList.value = [createDeleteOption(row)]
}

function getSelectedRows() {
  return gridRef.value?.getCheckboxRecords?.() || []
}

function getRowsToDelete(row: Record<string, any>) {
  if (selectedRows.value.length > 1) {
    return selectedRows.value
  }
  return [row]
}

function createDeleteOption(row: Record<string, any>): CellPopoverOption {
  const rowsToDelete = getRowsToDelete(row)
  const isBatchDelete = rowsToDelete.length > 1

  return {
    label: isBatchDelete ? t('mdTable.deleteSelectedRow', { count: rowsToDelete.length }) : t('mdTable.deleteRow'),
    icon: 'material-symbols:delete-outline',
    onClick: () => handleDeleteRows(rowsToDelete)
  }
}

async function handleDeleteRows(rows: Record<string, any>[]) {
  const ids = rows.map((row) => String(row.id))
  const message = ids.length > 1 ? t('mdTable.deleteSelectedRow', { count: ids.length }) : t('mdTable.deleteRow', { count: 1 })

  try {
    await ElMessageBox.confirm(message, {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete'),
      dangerouslyUseHTMLString: true
    })
    await deleteRow(ids.length > 1 ? ids : ids[0])
    gridRef.value?.remove?.(rows.length > 1 ? rows : rows[0])
    tableData.value = tableData.value.filter((row) => !ids.includes(String(row.id)))
  } catch {
    // 用户取消确认框时保持静默。
  } finally {
    close()
  }
}

function close() {
  popoverRef.value?.close()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiDpPopover ref="popoverRef">
    <div class="cell-popover">
      <div
        v-for="item in optionList"
        :key="item.label"
        class="cell-popover-item"
        tabindex="0"
        :aria-label="item.label"
        @click="item.onClick"
        @keydown.enter="item.onClick"
      >
        <Icon :name="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </div>
  </UiDpPopover>
</template>

<style scoped lang="scss">
.cell-popover {
  margin: var(--app-space-xs);
}
.cell-popover-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  &:hover {
    background: var(--app-primary-alpha-30);
    color: var(--app-primary-color);
  }
}
</style>
