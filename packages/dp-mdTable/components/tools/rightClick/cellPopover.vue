<template>
  <UiPopoverDialog ref="popoverRef" width="60px">
    <div class="cell-popover">
      <div class="cell-popover-item" v-for="item in optionList" :key="item.label" @click="item.onClick">
        <Icon :name="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>
<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
const { t } = useI18n()
const { gridRef, clearCheckboxRow, deleteRow } = useMDTableInject()

const popoverRef = ref()
const selectedRows = ref<any>([])
const optionList = ref<any>([])
function open(target: HTMLElement, { row, column }: any) {
  // TODO 可能需要取消target高亮，并设置行高亮
  selectedRows.value = gridRef.value?.getCheckboxRecords() || []
  if (selectedRows.value.length > 0) {
    // TODO 需要优化，如果右击非table row，需要clearCheckboxRow
    const isInSelected = selectedRows.value.some((item) => item.id === row.id)
    if (!isInSelected) {
      clearCheckboxRow()
      return
    }
  }
  console.log(selectedRows.value, 'selectedRows')
  popoverRef.value.open(target)
  if (selectedRows.value.length > 1) {
    optionList.value = [
      {
        label: t('mdTable.deleteSelectedRow', { count: selectedRows.value.length }),
        icon: 'Delete',
        onClick: async() => {
          try{
            await ElMessageBox.confirm(t('mdTable.deleteSelectedRow', { count: selectedRows.value.length }), {
              confirmButtonClass: 'el-button el-button--warning',
              confirmButtonText: t('common_confirmDelete'),
              dangerouslyUseHTMLString: true
            })
            await deleteRow(selectedRows.value.map((item: any) => String(item.id)))
            gridRef.value?.remove(selectedRows.value)
          } catch (error) {
            console.error(error)
          } finally {
            close()
          }
        }
      }
    ]
  } else {
    optionList.value = [
      {
        label: t('mdTable.deleteRow'),
        icon: 'Delete',
        onClick: async() => {
          try{
            await ElMessageBox.confirm(t('mdTable.deleteRow', { count: 1 }), {
              confirmButtonClass: 'el-button el-button--warning',
              confirmButtonText: t('common_confirmDelete'),
              dangerouslyUseHTMLString: true
            })
            await deleteRow(String(row.id))
            gridRef.value?.remove(row)
          } catch (error) {
            console.error(error)
          } finally {
            close()
          }
        }
      }
    ]
  }
}
function close() {
  popoverRef.value.close()
}
defineExpose({
  open,
  close
})
</script>
<style scoped lang="scss">
.cell-popover-item {
  cursor: pointer;
  &:hover {
    background: var(--app-primary-alpha-10);
    color: var(--app-primary);
  }
}
</style>
