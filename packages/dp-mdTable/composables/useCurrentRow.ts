export function useCurrentRow() {
  
  const { gridRef, tableData } = useMDTableInject() as any
  const currentRow = ref<any>(null)
  const currentIndex = ref<number>(0)
  const disabledUp = ref<boolean>(false)
  const disabledDown = ref<boolean>(false)
  const setCurrentRow = (row: any) => {
    currentRow.value = row
    currentIndex.value = tableData.value.findIndex((item: any) => item.id === row.id)
    disabledUp.value = currentIndex.value === 0
    disabledDown.value = currentIndex.value === tableData.value.length - 1

    gridRef.value?.setCurrentRow(row)
    gridRef.value?.scrollToRow(row)
  }
  const moveCurrentRow = (direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex.value - 1 : currentIndex.value + 1
    if (newIndex >= 0 && newIndex < tableData.value.length) {
      console.log('tableData.value[newIndex]', tableData.value[newIndex])
      setCurrentRow(tableData.value[newIndex])
    }
  }
  return {
    currentRow,
    currentIndex,
    disabledUp,
    disabledDown,
    setCurrentRow,
    moveCurrentRow
  }
}
