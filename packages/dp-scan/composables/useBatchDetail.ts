import { clientApi } from 'api'
import { normalizeValue, createValidator, type NormalizeOptions, type ValidationFunction } from '../types/formOCR'

/**
 * Batch Detail Composable
 *
 * Zone Schema Documentation:
 * --------------------------
 * Sections and Fields have zone data in the following format:
 *
 * {
 *   zone: {
 *     page: number,  // Page number where this section/field is located (1-based)
 *     zone: string   // Zone coordinates: "x1,y1,x2,y2" (topleft x, topleft y, bottomright x, bottomright y)
 *   }
 * }
 *
 * Example:
 * {
 *   zone: {
 *     page: 1,
 *     zone: "1805,71,2311,600"
 *   },
 *   fields: [
 *     {
 *       zone: {
 *         page: 1,
 *         zone: "1805,71,2311,600"
 *       }
 *     }
 *   ]
 * }
 *
 * Note: formClassificationConfig uses a simpler format where zone is just a string:
 * {
 *   single_code_1: {
 *     zone: "2154,525,2278,613"
 *   }
 * }
 *
 * Result JSON Structure:
 * ----------------------
 * newResultJson and oldResultJson map section names to field values:
 * {
 *   "Section Name": {
 *     "Field Label": "value",
 *     "Another Field": "value"
 *   },
 *   "Table Section Name": [
 *     { "Field Label": "value", ... },
 *     { "Field Label": "value", ... }
 *   ]
 * }
 */

export type HighlightedParams = {
  page: number // start from 1
  zone: string // 'topleft x,topleft y, bottom right x, bottom right y'
}

export type ZoneObject = {
  page: number
  zone: string
}

export type FieldWithValue = {
  key: string
  type: string
  zone: ZoneObject
  lable: string
  label?: string
  need_ocr: boolean
  required?: boolean
  export_label: string
  support_chs_to_cht?: boolean
  field_setting?: {
    options: Record<string, string>[]
  }
  // Added values from result JSON
  currentValue: any
  originalValue: any
  options?: { label: string; value: string }[]
  // Normalization and validation
  normalize_options?: NormalizeOptions
  validation_function?: ValidationFunction
}

export type SectionWithValues = {
  zone: ZoneObject
  fields: FieldWithValue[]
  section_id: string
  corp_to_scan: boolean
  export_label: string
  merge_method: string
  section_name: string
  section_type: 'standard' | 'table'
  save_to_result: boolean
  prompt_template_id: string
  // Added values from result JSON
  currentValue: any
  originalValue: any
  // For table type sections
  rows?: { currentValue: any; originalValue: any; fields: FieldWithValue[] }[]
}

// Type for editable sections (save_to_result = true)

export type BatchDetailContext = {
  currentBatchId: Ref<string>
  detailLoading: Ref<boolean>
  documentLoading: Ref<boolean>
  previewLoading: Ref<boolean>
  batchDetail: Ref<any>
  projectId: ComputedRef<string | undefined>
  currentSelectedDoc: Ref<any>
  selectedDocDetail: Ref<any>
  totalPages: Ref<number | undefined>
  currentPageNumber: Ref<number | undefined>
  previewImgUrl: Ref<string | null>
  highlightedSection: Ref<HighlightedParams | undefined>
  highlightedField: Ref<HighlightedParams | undefined>
  sectionsWithValues: Ref<SectionWithValues[]>
  isLockedByOther: Ref<boolean>
  lockedByUser: Ref<string | undefined>
  selectSection: (section: any) => void
  selectField: (field: any) => void
  changePage: (pageNumber: number) => Promise<void>
  updateFieldValue: (sectionId: string, fieldKey: string, value: any, rowIndex?: number) => void
  addTableRow: (sectionId: string) => void
  saveDraft: () => Promise<void>
  confirm: () => Promise<void>
  reload: () => Promise<void>
  updateSectionZone: (sectionId: string, newZone: ZoneObject) => Promise<void>
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

  // Abort controller for canceling image requests
  let currentImageAbortController: AbortController | null = null

  // Computed: Sections combined with result values
  const sectionsWithValues = ref<SectionWithValues[]>([])

  // Computed: Get projectId from batchDetail
  const projectId = computed(() => batchDetail.value?.projectId)

  // Batch lock state
  const isLockedByOther = ref(false)
  const lockedByUser = ref<string | undefined>()

  // Watch for selectedDocDetail changes and rebuild sectionsWithValues
  watch(selectedDocDetail, () => {
    if (selectedDocDetail.value) {
      buildSectionsWithValues()
      setupPreview()
    }
  }, { deep: true })

  function buildSectionsWithValues() {
    const settings = selectedDocDetail.value?.setting?.fieldsSetting
    const detail = selectedDocDetail.value?.detail

    if (!settings?.section || !detail) {
      sectionsWithValues.value = []
      return
    }

    const newResult = detail.newResultJson || {}
    const oldResult = detail.oldResultJson || {}

    sectionsWithValues.value = settings.section.map((section: any): SectionWithValues => {
      const sectionName = section.section_name
      const newSectionData = newResult[sectionName]
      const oldSectionData = oldResult[sectionName]

      // Handle table type sections
      if (section.section_type === 'table') {
        const newRows = Array.isArray(newSectionData) ? newSectionData : []
        const oldRows = Array.isArray(oldSectionData) ? oldSectionData : []

        const rows = newRows.map((rowData: any, index: number) => {
          const oldRowData = oldRows[index] || {}
          return {
            currentValue: rowData,
            originalValue: oldRowData,
            fields: section.fields?.map((field: any): FieldWithValue => {
              const fieldLabel = field.lable || field.label
              const rawValue = rowData?.[fieldLabel] ?? ''
              const normalizedValue = field.normalize_options
                ? normalizeValue(rawValue, field.normalize_options)
                : rawValue
              return {
                ...field,
                currentValue: normalizedValue,
                originalValue: oldRowData?.[fieldLabel] ?? '',
                options: field.field_setting?.options?.map((opt: Record<string, string>) => {
                  const [value, label] = Object.entries(opt)[0] || ['', '']
                  return { value, label }
                }),
                normalize_options: field.normalize_options,
                validation_function: field.validation_function
              }
            })
          }
        })

        return {
          ...section,
          currentValue: newSectionData,
          originalValue: oldSectionData,
          fields: section.fields?.map((field: any): FieldWithValue => ({
            ...field,
            currentValue: '',
            originalValue: '',
            options: field.field_setting?.options?.map((opt: Record<string, string>) => {
              const [value, label] = Object.entries(opt)[0] || ['', '']
              return { value, label }
            }),
            normalize_options: field.normalize_options,
            validation_function: field.validation_function
          })),
          rows
        }
      }

      // Handle standard sections
      const newSectionValues = newSectionData || {}
      const oldSectionValues = oldSectionData || {}

      return {
        ...section,
        currentValue: newSectionValues,
        originalValue: oldSectionValues,
        fields: section.fields?.map((field: any): FieldWithValue => {
          const fieldLabel = field.lable || field.label
          const rawValue = newSectionValues?.[fieldLabel] ?? ''
          const normalizedValue = field.normalize_options
            ? normalizeValue(rawValue, field.normalize_options)
            : rawValue
          return {
            ...field,
            currentValue: normalizedValue,
            originalValue: oldSectionValues?.[fieldLabel] ?? '',
            options: field.field_setting?.options?.map((opt: Record<string, string>) => {
              const [value, label] = Object.entries(opt)[0] || ['', '']
              return { value, label }
            }),
            normalize_options: field.normalize_options,
            validation_function: field.validation_function
          }
        })
      }
    })
  }

  // Convert sectionsWithValues back to newResultJson format
  function buildResultJson(): Record<string, any> {
    const result: Record<string, any> = {}

    sectionsWithValues.value.forEach((section) => {
      const sectionName = section.section_name

      if (section.section_type === 'table') {
        // Table sections are arrays of row objects
        result[sectionName] = section.rows?.map(row => {
          const rowData: Record<string, any> = {}
          row.fields.forEach(field => {
            const fieldLabel = field.lable || field.label
            rowData[fieldLabel] = field.currentValue
          })
          return rowData
        }) || []
      } else {
        // Standard sections are objects with field labels as keys
        const sectionData: Record<string, any> = {}
        section.fields.forEach(field => {
          const fieldLabel = field.lable || field.label
          sectionData[fieldLabel] = field.currentValue
        })
        result[sectionName] = sectionData
      }
    })

    return result
  }

  // End State

  async function getBatchDetail() {
    detailLoading.value = true
    isLockedByOther.value = false
    lockedByUser.value = undefined
    try {
      const response = await clientApi.api.getCaptureBatchBatchidDetail(currentBatchId.value)
      batchDetail.value = response.data
      currentSelectedDoc.value = response.data.documents[0]

      // Handle batch locking
      const userId = useUserId()
      const lockBy = batchDetail.value.lockBy

      if (!lockBy || lockBy === userId.value) {
        // Batch is not locked or locked by current user - open it
        await clientApi.api.postCaptureBatchBatchidOpen(currentBatchId.value)
        isLockedByOther.value = false
        lockedByUser.value = undefined
      } else {
        // Batch is locked by another user - set readonly state
        isLockedByOther.value = true
        lockedByUser.value = lockBy
        console.warn(`Batch is locked by user: ${lockBy}`)
      }
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
      const docDetailRes = await clientApi.api.getCaptureBatchBatchidDocDocidDetail(batchDetail.value.id, docId)
      const res = await clientApi.api.getCaptureProjformsettingId(docDetailRes.data.formId)

      const pageSplitConfig = JSON.parse(res.data.pageSplitConfig) || { split_into_number_of_page: 1 }
      const formClassificationConfig = JSON.parse(res.data.formClassificationConfig) || {}

      const fieldsSetting = JSON.parse(res.data.fieldsSetting) || {}

      selectedDocDetail.value = {
        setting: {
          ...res.data,
          pageSplitConfig,
          formClassificationConfig,
          fieldsSetting,
        },
        detail: docDetailRes.data
      }
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

    // Clear highlights when changing page
    highlightedSection.value = undefined
    highlightedField.value = undefined

    await renderPage(pageNumber)
  }

  /**
   * Cancel any in-flight image download request
   */
  function cancelImageRequest() {
    if (currentImageAbortController) {
      currentImageAbortController.abort()
      currentImageAbortController = null
    }
  }

  async function downloadImage(path: string): Promise<Blob> {
    // Cancel any previous request
    cancelImageRequest()

    // Create new abort controller for this request
    currentImageAbortController = new AbortController()

    try {
      const b = await clientApi.api.postCaptureFileQuerycapturefilebypath({ path }, {
        format: 'blob',
        headers: { noThrowError: true },
        signal: currentImageAbortController.signal
      })
      currentImageAbortController = null
      //@ts-ignore
      return b
    } catch (error: any) {
      currentImageAbortController = null
      // Re-throw if not aborted
      if (error.name !== 'AbortError') {
        throw error
      }
      // Return empty blob for aborted requests
      return new Blob()
    }
  }

  async function renderPage(pageNumber: number) {
    // Cancel any pending image request before starting new one
    cancelImageRequest()

    previewLoading.value = true
    try {
      const url = selectedDocDetail.value?.detail?.pages?.[pageNumber - 1]
      if (url) {
        const blob = await downloadImage(url)
        // Skip if request was aborted (empty blob)
        if (blob.size === 0) return

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

  /**
   * Parse zone string to coordinates
   * Zone format: "x1,y1,x2,y2" (topleft x, topleft y, bottomright x, bottomright y)
   */
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

  /**
   * Extract zone info from section/field object
   * Section/Field zone structure: { page: number, zone: "x1,y1,x2,y2" }
   */
  function getZoneFromObject(obj: any): { page: number; zone: string } | null {
    if (!obj?.zone) return null

    // Handle object format: { page: 1, zone: "x1,y1,x2,y2" }
    if (typeof obj.zone === 'object') {
      return {
        page: obj.zone.page || 1,
        zone: obj.zone.zone
      }
    }

    // Handle string format (fallback for other configs)
    return {
      page: obj.page || 1,
      zone: obj.zone
    }
  }

  function selectSection(section: any) {
    if (!section) {
      highlightedSection.value = undefined
      return
    }

    const zoneInfo = getZoneFromObject(section)
    if (zoneInfo) {
      highlightedSection.value = {
        page: zoneInfo.page,
        zone: zoneInfo.zone
      }
      // Change page if needed
      if (zoneInfo.page !== currentPageNumber.value) {
        changePage(zoneInfo.page)
      }
    }
  }

  function selectField(field: any) {
    if (!field) {
      highlightedField.value = undefined
      return
    }

    const zoneInfo = getZoneFromObject(field)
    if (zoneInfo) {
      highlightedField.value = {
        page: zoneInfo.page,
        zone: zoneInfo.zone
      }
      // Change page if needed
      if (zoneInfo.page !== currentPageNumber.value) {
        changePage(zoneInfo.page)
      }
    }
  }

  /**
   * Update a field value in sectionsWithValues
   */
  function updateFieldValue(sectionId: string, fieldKey: string, value: any, rowIndex?: number) {
    const section = sectionsWithValues.value.find((s) => s.section_id === sectionId)
    if (!section) return

    if (section.section_type === 'table' && rowIndex !== undefined) {
      // Update field in specific row
      const row = section.rows?.[rowIndex]
      if (row) {
        const field = row.fields.find((f) => f.key === fieldKey)
        if (field) {
          field.currentValue = value
        }
      }
    } else {
      // Update field in standard section
      const field = section.fields.find((f) => f.key === fieldKey)
      if (field) {
        field.currentValue = value
      }
    }
  }

  /**
   * Add a new row to a table section
   */
  function addTableRow(sectionId: string) {
    const section = sectionsWithValues.value.find((s) => s.section_id === sectionId)
    if (!section || section.section_type !== 'table') return

    if (!section.rows) {
      section.rows = []
    }

    // Create new row with empty values
    const newRow = {
      currentValue: {},
      originalValue: {},
      fields: section.fields.map((field): FieldWithValue => ({
        ...field,
        currentValue: '',
        originalValue: ''
      }))
    }

    section.rows.push(newRow)
  }

  /**
   * Save draft - saves current values without finalizing
   */
  async function saveDraft() {
    if (!currentSelectedDoc.value || !selectedDocDetail.value) return

    const newResultJson = buildResultJson()

    try {
      await clientApi.api.postCaptureBatchBatchidDocDocidSaveDraft(
        currentBatchId.value,
        currentSelectedDoc.value.id,
        {
          newResultJson,
          oldValue: selectedDocDetail.value.detail?.oldValue,
          newValue: selectedDocDetail.value.detail?.newValue,
          formSource: selectedDocDetail.value.detail?.formSource,
          familyCategory: selectedDocDetail.value.detail?.familyCategory
        }
      )
    } catch (error) {
      console.error('Failed to save draft:', error)
      throw error
    }
  }

  /**
   * Confirm - saves and finalizes the document
   */
  async function confirm() {
    if (!currentSelectedDoc.value || !selectedDocDetail.value) return

    const newResultJson = buildResultJson()

    try {
      await clientApi.api.postCaptureBatchBatchidDocDocidConfirm(
        currentBatchId.value,
        currentSelectedDoc.value.id,
        {
          newResultJson,
          oldValue: selectedDocDetail.value.detail?.oldValue,
          newValue: selectedDocDetail.value.detail?.newValue,
          formSource: selectedDocDetail.value.detail?.formSource,
          familyCategory: selectedDocDetail.value.detail?.familyCategory
        }
      )
    } catch (error) {
      console.error('Failed to confirm:', error)
      throw error
    }
  }

  /**
   * Update section zone (crop area) in the form setting
   */
  async function updateSectionZone(sectionId: string, newZone: ZoneObject) {
    if (!selectedDocDetail.value?.setting) return

    const formId = batchDetail.value?.formId
    if (!formId) {
      console.error('No formId available')
      return
    }

    // Find the section in the current settings
    const settings = selectedDocDetail.value.setting.fieldsSetting
    const sectionIndex = settings.section?.findIndex((s: any) => s.section_id === sectionId)

    if (sectionIndex === -1) {
      console.error('Section not found:', sectionId)
      return
    }

    // Update local state first (optimistic update)
    settings.section[sectionIndex].zone = newZone

    // Prepare the updated fieldsSetting
    const updatedFieldsSetting = JSON.stringify(settings)

    try {
      // Call API to update form setting
      await clientApi.api.putCaptureProjformsettingId(formId, {
        ...selectedDocDetail.value.setting,
        fieldsSetting: updatedFieldsSetting
      })

      console.log('Section zone updated successfully')
    } catch (error) {
      console.error('Failed to update section zone:', error)
      // Could revert local state here if needed
      throw error
    }
  }

  const context: BatchDetailContext = {
    currentBatchId,
    detailLoading,
    documentLoading,
    previewLoading,
    batchDetail,
    projectId,
    currentSelectedDoc,
    selectedDocDetail,
    totalPages,
    currentPageNumber,
    previewImgUrl,
    highlightedSection,
    highlightedField,
    sectionsWithValues,
    isLockedByOther,
    lockedByUser,
    selectSection,
    selectField,
    changePage,
    updateFieldValue,
    addTableRow,
    saveDraft,
    confirm,
    reload: getBatchDetail,
    updateSectionZone
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

  // Cleanup on unmount
  onUnmounted( async() => {
    console.log('Unmounted batch detail')
    await clientApi.api.postCaptureBatchBatchidRelease(currentBatchId.value)
    // Cancel any pending image request
    cancelImageRequest()

    if (previewImgUrl.value?.startsWith('blob:')) {
      URL.revokeObjectURL(previewImgUrl.value)
    }
  })

  return context
}

export const useBatchDetailContext = (): BatchDetailContext | undefined => {
  return inject<BatchDetailContext>('batchDetailProvider')
}
