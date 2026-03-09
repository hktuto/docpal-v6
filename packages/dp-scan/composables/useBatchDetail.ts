import { clientApi } from 'api'

export type HighlightedParams = {
  page: number // start from 1
  zone: string // 'topleft x,topleft y, bottom right x, bottom right y'
}

export type BatchDetailContext = {
  currentBatchId: Ref<string>
  detailLoading: Ref<boolean>
  documentLoading: Ref<boolean>
  previewLoading: Ref<boolean>
  batchDetail: Ref<any>
  currentSelectedDoc: Ref<any>
  selectedDocDetail: Ref<any>
  totalPages: Ref<number | undefined>
  currentPageNumber: Ref<number | undefined>
  previewImgUrl: Ref<string | null>
  highlightedSection: Ref<HighlightedParams | undefined>
  highlightedField: Ref<HighlightedParams | undefined>
  selectSection: (section: any) => void
  selectField: (field: any) => void
  changePage: (pageNumber: number) => Promise<void>
}

export const useBatchDetail = (batchId: string) => {
  // State
  const currentBatchId = ref(batchId)
  const detailLoading = ref(false)
  const documentLoading = ref(false)
  const previewLoading = ref(false)
  const batchDetail = ref()

  // Selected Document State
  const currentSelectedDoc = ref()
  const selectedDocDetail = ref()

  // Document Detail State
  const totalPages = ref<number>()
  const currentPageNumber = ref<number>()
  const previewImgUrl = ref<string | null>(null)

  const highlightedSection = ref<HighlightedParams>()
  const highlightedField = ref<HighlightedParams>()

  // End State

  async function getBatchDetail() {
    detailLoading.value = true
    try {
      const response = await clientApi.api.getCaptureBatchBatchidDetail(currentBatchId.value)
      batchDetail.value = response.data
      currentSelectedDoc.value = response.data.documents[0]
    } catch (error) {
      console.error(error)
    } finally {
      console.log("batchDetail", batchDetail.value)
      detailLoading.value = false
    }
  }

  async function getDocumentDetail(docId: string) {
    documentLoading.value = true
    try {
      const res = await clientApi.api.getCaptureProjformsettingId(batchDetail.value.formId)
      const pageSplitConfig = JSON.parse(res.data.pageSplitConfig) || { split_into_number_of_page: 1 }
      const formClassificationConfig = JSON.parse(res.data.formClassificationConfig) || {}
      const fieldsSetting = JSON.parse(res.data.fieldsSetting) || {}
      const docDetailRes = await clientApi.api.getCaptureBatchBatchidDocDocidDetail(batchDetail.value.id, docId)
      selectedDocDetail.value = {
        setting: {
          ...res.data,
          pageSplitConfig,
          formClassificationConfig,
          fieldsSetting,
        },
        detail: docDetailRes.data
      }
      console.log("selectedDocDetail", selectedDocDetail.value)
    } catch (error) {
      console.error(error)
    } finally {
      documentLoading.value = false
    }
  }

  async function setupPreview() {
    if (!selectedDocDetail.value?.detail?.pages) return
    totalPages.value = selectedDocDetail.value?.detail.pages.length
    currentPageNumber.value = 1
    await changePage(1)
  }

  async function changePage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > (totalPages.value || 1)) return
    currentPageNumber.value = pageNumber
    await renderPage(pageNumber)
  }

  async function downloadImage(path: string): Promise<Blob> {
    const b = await clientApi.api.postCaptureFileQuerycapturefilebypath({ path }, {
      format: 'blob',
      headers: { noThrowError: true }
    })
    //@ts-ignore
    return b
  }

  async function renderPage(pageNumber: number) {
    previewLoading.value = true
    try {
      const url = selectedDocDetail.value?.detail?.pages?.[pageNumber - 1]
      if (url) {
        const blob = await downloadImage(url)
        // Revoke old URL to prevent memory leak
        if (previewImgUrl.value?.startsWith('blob:')) {
          URL.revokeObjectURL(previewImgUrl.value)
        }
        previewImgUrl.value = URL.createObjectURL(blob)
      }
    } catch (e) {
      console.error('Failed to render page:', e)
    } finally {
      previewLoading.value = false
    }
  }

  function parseZone(zone: string): { x: number; y: number; width: number; height: number } | null {
    if (!zone) return null
    const parts = zone.split(',').map(p => parseFloat(p.trim()))
    if (parts.length !== 4 || parts.some(isNaN)) return null
    const [x1, y1, x2, y2] = parts
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    }
  }

  function selectSection(section: any) {
    if (!section || !section.zone || !section.zone.zone) {
      highlightedSection.value = undefined
      return
    }

    const zone = parseZone(section.zone.zone)
    if (zone) {
      highlightedSection.value = {
        page: section.page || 1,
        zone: section.zone.zone
      }
      // Change page if needed
      console.log("selected zone", section)
      if (section.zone.page && section.zone.page !== currentPageNumber.value) {
        changePage(section.zone.page)
      }
    }
  }

  function selectField(field: any) {
    if (!field || !field.zone || !field.zone.zone) {
      highlightedField.value = undefined
      return
    }

    const zone = parseZone(field.zone.zone)
    if (zone) {
      highlightedField.value = {
        page: field.zone.page || 1,
        zone: field.zone.zone
      }
      // Change page if needed
      if (field.zone.page && field.zone.page !== currentPageNumber.value) {
        changePage(field.zone.page)
      }
    }
  }

  const context: BatchDetailContext = {
    currentBatchId,
    detailLoading,
    documentLoading,
    previewLoading,
    batchDetail,
    currentSelectedDoc,
    selectedDocDetail,
    totalPages,
    currentPageNumber,
    previewImgUrl,
    highlightedSection,
    highlightedField,
    selectSection,
    selectField,
    changePage
  }

  provide('batchDetailProvider', context)

  watch(currentBatchId, (newVal) => {
    if (newVal) {
      getBatchDetail()
    }
  }, {
    immediate: true
  })
  watch(currentSelectedDoc, () => {
    if (currentSelectedDoc.value) {
      // Clear highlights when switching documents
      highlightedSection.value = undefined
      highlightedField.value = undefined
      getDocumentDetail(currentSelectedDoc.value.id)
    }
  })



  watch(selectedDocDetail, () => {
    if (selectedDocDetail.value) {
      setupPreview()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (previewImgUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImgUrl.value)
    }
  })

  return context
}

export const useBatchDetailContext = (): BatchDetailContext | undefined => {
  return inject<BatchDetailContext>('batchDetailProvider')
}
