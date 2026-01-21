import { useDebounceFn } from '@vueuse/core'
import { emitBus, EventType } from 'eventbus'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
export const useBrowseBreadcrumbDrop = () => {
  const currentRow = ref<any>({
    el: null,
    id: '',
    data: null
  })
  const DEBOUNCE_TIME = 200
  const { createUploadRequest } = useUploadAIStore()
  const { t } = useI18n()
  const BrowseDragMove: any = inject('BrowseDragMove')
  async function handleDrop(event: any) {
    event.preventDefault()
    event.stopPropagation()
    const dropRow = JSON.parse(JSON.stringify(currentRow.value))
    BrowseDragMove.setDropRow(dropRow, true)
    handleDragleave()
    const docDetail = await clientApi.api.getDmsDocument({ idOrPath: dropRow.data.id }).then((res: any) => res.data)
    if (!docDetail) return
    const canDrop = RbacAllowTo('create', { ...docDetail })
    if (!canDrop) {
      ElMessage.warning(t('dpTip.noUploadPermission'))
      return
    }
    try {
      const files: any = await addDataTransfer(event.dataTransfer)
      uploadFiles(dropRow.data, files)
    } catch (error) {
      console.log('error', error)
    } finally {
    }
  }
  const handleDragover = useDebounceFn(
    (event: any, docDetail: any) => {
      event.stopPropagation()
      const rowEl = getParentRowId(event.target)
      if (rowEl) {
        if (currentRow.value.id !== docDetail.id) {
          if (currentRow.value.el) {
            currentRow.value.el.classList.remove('drop-row')
          }
          // change currentRow
          currentRow.value.el = rowEl
          currentRow.value.id = docDetail?.id
          currentRow.value.data = docDetail
          currentRow.value.el.classList.add('drop-row')
        }
      }
    },
    DEBOUNCE_TIME,
    {
      maxWait: DEBOUNCE_TIME
    }
  )

  function getParentRowId(element: any) {
    if (!element) return null
    if (element.classList?.contains('breadItem')) {
      return element
    }
    return getParentRowId(element?.parentElement)
  }
  function handleDragleave(event?: any) {
    event?.stopPropagation()
    setTimeout(() => {
      if (currentRow.value.el) {
        currentRow.value.el.classList.remove('drop-row')
      }
      currentRow.value.el = null
      currentRow.value.id = ''
      currentRow.value.data = null
    }, DEBOUNCE_TIME + 30)
  }
  async function uploadFiles(doc: any, files: any[]) {
    if (!files || files.length === 0) return
    const ev = new CustomEvent('openUploadDrawer', { detail: true })
    document.dispatchEvent(ev)
    await createUploadRequest(doc, files)
    setTimeout(() => {
      emitBus(EventType.FILE_NEED_REFRESH, {
        relatedIdOrPath: doc.id
      })
    }, 1000)
  }

  return {
    dropEvent: {
      drop: handleDrop,
      dragover: handleDragover,
      dragleave: handleDragleave
    }
  }
}
