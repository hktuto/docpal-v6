import type { Ref } from 'vue'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import { emitBus, EventType } from 'eventbus'
import { Loading } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
// import { ElMessageBox } from 'element-plus'
export const useBrowseDragMove = (selectedList: any) => {
  const dragRows = ref<any[]>([])
  const dropRow = ref<any>({ name: '' })
  const breadCrumbDropRow = ref<any>({ name: '' })
  const { t } = useI18n()
  async function handleDragEnd(data: any) {
    const dropTargetRow = breadCrumbDropRow.value.name ? breadCrumbDropRow.value : dropRow.value
    const confirm = await ElMessageBox.confirm(
      t('browse.confirmMoveFile', {
        target: dropTargetRow.name || 'test',
        source: isDragSelectedRows(data.oldRow)
          ? t('browse.selectedItem', {
              count: selectedList.value.length
            })
          : data.oldRow.name
      }),
      {
        dangerouslyUseHTMLString: true
      }
    )
    if (confirm !== 'confirm') return
    const copyItems = dragRows.value
    //check duplicate'

    const {
      data: { hasDuplicateTitle }
    } = (await newClientApi.postDmsDocumentIsduplicatename({
      path: dropTargetRow.path,
      titles: copyItems.map((item) => item.name)
    })) as any
    if (hasDuplicateTitle) {
      ElMessage({
        message: t('dpTip_duplicateFileName') as string,
        type: 'error'
      })
      return
    }

    for (const item of copyItems) {
      const param = [{ idOrPath: item.path }, { idOrPath: dropTargetRow.path }]
      const noti = ElNotification({
        title: t('move'),
        icon: Loading,
        dangerouslyUseHTMLString: true,
        message: `<div title="${item.name}">${item.name}</div>`,
        showClose: true,
        customClass: 'loading-notification',
        duration: 0,
        position: 'bottom-right'
      })
      try {
        await newClientApi.postDmsDocumentMove(param).then(r => r.data)
      } finally {
        noti.close()
      }
    }
    handleRefresh(copyItems, dropTargetRow)
  }
  function isDragSelectedRows(row: any) {
    if (!selectedList.value) return false
    return selectedList.value.some((item: any) => item.id === row.id)
  }
  function getToolTip(row: any) {
    if (isDragSelectedRows(row)) {
      dragRows.value = selectedList.value
      return t('browse.selectedItem', {
        count: selectedList.value.length
      })
    } else {
      dragRows.value = [row]
      return row.name
    }
  }
  function setDropRow(row: any, isBreadCrumb: boolean = false) {
    if (!row) return
    const data = JSON.parse(JSON.stringify(row))
    if (isBreadCrumb) breadCrumbDropRow.value = data.data
    else {
      dropRow.value = !!data.parentData ? data.parentData : data.data
      if (!dropRow.value) dropRow.value = { name: '' }
      dropRow.value.canDrop = data.canDrop || false
    }
  }
  function handleRefresh(dragSourceRows: any, dropTargetRow: any) {
    const exitSourceId: any[] = []
    dragSourceRows.forEach((item: any) => {
      if (!exitSourceId.includes(item.parentRef)) {
        exitSourceId.push(item.parentRef)
        emitBus(EventType.FILE_NEED_REFRESH, {
          relatedIdOrPath: item.parentRef
        })
      }
    })
    console.log('exitSourceId', exitSourceId)

    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: dropTargetRow.id
    })
  }
  return {
    dragRows,
    dropRow,
    handleDragEnd,
    isDragSelectedRows,
    getToolTip,
    setDropRow
  }
}
