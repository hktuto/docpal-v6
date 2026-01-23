<template>
  <UiPopoverDialog ref="popoverRef" width="60px">
    <div class="cell-popover">
      <div v-for="item in optionList" :key="item.label" @click="item.onClick">
        <Icon :name="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>
<script setup lang="ts">
const { t } = useI18n()
const { gridRef } = useMDTableInject()
const popoverRef = ref()
const selectedRows = ref([])
const optionList = ref([])
function open(target: HTMLElement, { row, column }: any) {
  // TODO 可能需要取消target高亮，并设置行高亮
  selectedRows.value = gridRef.value?.getCheckboxRecords() || []
  if (selectedRows.value.length > 0) {
    // TODO 需要优化，如果右击非table row，需要clearCheckboxRow
    const isInSelected = selectedRows.value.some((item) => item.id === row.id)
    if (!isInSelected) {
      selectedRows.value.forEach((row) => {
        row.checked = false
      })
      gridRef.value?.clearCheckboxRow()
      return
    }
  }
  console.log(selectedRows.value, 'selectedRows')
  popoverRef.value.open(target)
  if (selectedRows.value.length > 0) {
    optionList.value = [
      {
        label: t('mdTable.deleteSelectedRow', { count: selectedRows.value.length }),
        icon: 'Delete',
        onClick: () => {
          gridRef.value?.remove(selectedRows.value)
        }
      }
    ]
  } else {
    optionList.value = [
      {
        label: t('mdTable.deleteRow'),
        icon: 'Delete',
        onClick: () => {
          gridRef.value?.remove(row)
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
.cell-popover {
}
</style>
