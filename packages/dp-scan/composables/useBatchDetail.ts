import { clientApi } from 'api'
import { normalizeValue, createValidator, type NormalizeOptions, type ValidationFunction } from '../types/formOCR'
import { useOldValue } from 'element-plus/es/components/time-picker/src/composables/use-time-picker.mjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend dayjs with customParseFormat for strict date parsing
dayjs.extend(customParseFormat)

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
  section_type?: string
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
  format?: string // e.g. 'DD/MM/YYYY' for date formatting
  page?: number // for table type if field is from other page then section
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
  removeTableRow: (sectionId: string, rowIndex: number) => void
  saveDraft: () => Promise<void>
  confirm: () => Promise<void>
  reload: () => Promise<void>
  updateSectionZone: (sectionId: string, newZone: ZoneObject) => Promise<void>
  buildResultJson: () => Record<string, any>
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
  watch(selectedDocDetail, (newValue, oldValue) => {
    if (selectedDocDetail.value && (!oldValue || newValue.detail.id !== oldValue.detail.id)) {
      buildSectionsWithValues()
      setupPreview()
    }
  }, { deep: true })

  function convertFieldToWithValues(field:any, newData: Record<string, any>, oldData: Record<string, any> | undefined) :FieldWithValue {
    const fieldLabel = field.lable || field.label
    const rawValue = newData?.[fieldLabel] ?? ''

    // if (fieldLabel === "FamilyMemberMaritalStatus") {
    //   console.log(field)
    //   const normalizedValue = normalizeValue(rawValue, field.field_setting.options, field.normalize_options)
    //   console.log("FamilyMemberMaritalStatus", rawValue, normalizedValue)

    // }

    const normalizedValue = field.normalize_options
      ? normalizeValue(rawValue, field.field_setting.options, field.normalize_options)
      : rawValue
    const normalizeOldValue = field.normalize_options
      ? normalizeValue(oldData?.[fieldLabel], field.field_setting.options, field.normalize_options)
      : oldData?.[fieldLabel]

    if (field.type === 'hkic') {
      const isValue = checkHKID(rawValue)
      field.warning = isValue ? isValue.message : undefined
    }
    return {
      ...field,
      currentValue: normalizedValue,
      originalValue: normalizeOldValue,
      options: field.field_setting?.options?.map((opt: Record<string, string>) => {
        const [value, label] = Object.entries(opt)[0] || ['', '']
        return { value, label }
      }),
      normalize_options: field.normalize_options,
      validation_function: field.validation_function
    }
  }

  function buildSectionsWithValues() {
    const settings = selectedDocDetail.value?.setting?.fieldsSetting
    const detail = selectedDocDetail.value?.detail

    if (!settings?.section || !detail) {
      sectionsWithValues.value = []
      return
    }

    const newResult = detail.newResultJson || {}
    const oldResult = detail.oldResultJson || {}
    // init oldResult


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

          const result = {
            currentValue: rowData,
            originalValue: oldRowData,
            fields: section.fields?.map((field: any): FieldWithValue => {
              return convertFieldToWithValues(field, rowData, oldRowData)
            })
          }
          // check if rowData has page , if so need to overide fields
          const page = rowData.page
          if (page) {
            result.fields.forEach((field: FieldWithValue) => {
              field.page = page
            })
          }
          return result
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
          return convertFieldToWithValues(field, newSectionValues, oldSectionValues)

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
          // add back the page number to row data
          if (row.fields[0].page) {
            rowData.page = row.fields[0].page
          }
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
      batchDetail.value.documents = batchDetail.value.documents.sort((a, b) => a.originalFilename.localeCompare(b.originalFilename))
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
      detailLoading.value = false
    }
  }

  async function getDocumentDetail(docId: string) {
    documentLoading.value = true
    try {
      const docDetailRes = await clientApi.api.getCaptureBatchBatchidDocDocidDetail(batchDetail.value.id, docId)
      const status = statusToGroupStatus(docDetailRes.data.status)
      if (!status || status.key.includes('failed') || status.key.includes('processing') || !docDetailRes.data.formId) {
        selectedDocDetail.value = {
          setting: null,
          detail: docDetailRes.data
        }
      } else {

        const res = await clientApi.api.getCaptureProjformsettingId(docDetailRes.data.formId)
        const pageSplitConfig = JSON.parse(res.data.pageSplitConfig) || { split_into_number_of_page: 1 }
        const formClassificationConfig = JSON.parse(res.data.formClassificationConfig) || {}

        const fieldsSetting = JSON.parse(res.data.fieldsSetting) || {}
        let setting = {
          ...res.data,
          pageSplitConfig,
          formClassificationConfig,
          fieldsSetting
        } as any
        let detail = docDetailRes.data
        // TODO : move the DocumentInitFunctionBackup back to backend
        //
        const { detail: newDetail, setting: newSetting } = DocumentInitFunctionBackup(detail, setting)
        if(newDetail) detail = newDetail
        if (newSetting) setting = newSetting
        selectedDocDetail.value = {
          setting,
          detail
        }
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
        ...obj,
        page: obj.page || obj.zone.page || 1,
        zone: obj.zone.zone,

      }
    }

    // Handle string format (fallback for other configs)
    return {
      ...obj,
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
        section_type: section.section_type,
        page: zoneInfo.page,
        zone: zoneInfo.zone
      }
      // Change page if needed
      if (zoneInfo.page !== currentPageNumber.value) {
        changePage(zoneInfo.page)
      }
    }
  }

  function selectField(field: any, section?:any) {
    if (!field) {
      highlightedField.value = undefined
      return
    }
    if (section) {
      if (section.section_type === 'table') {
        const newHightlight = {
          section_type: section.section_type,
          page: field.page || section.zone.page,
          zone: section.zone.zone
        }
        highlightedSection.value = newHightlight
        if (newHightlight.page !== currentPageNumber.value) {
          changePage(newHightlight.page)
        }
        return
      }
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
          if (field?.type === 'hkic') {
            const isValid = checkHKID(value)
            console.log('isValid', isValid)
            if (!isValid.result) {
              field.warning = isValid.message
            } else {
              field.warning = undefined
            }
          }
          field.currentValue = value
        }
      }
    } else {
      // Update field in standard section
      const field = section.fields.find((f) => f.key === fieldKey)
      if (field) {
        if (field?.type === 'hkic') {
          const isValid = checkHKID(value)
          console.log('isValid', isValid)
          if (!isValid.result) {
            field.warning = isValid.message
          } else {
            field.warning = undefined
          }
        }
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
   * Remove a row from a table section
   */
  function removeTableRow(sectionId: string, rowIndex: number) {
    const section = sectionsWithValues.value.find((s) => s.section_id === sectionId)
    if (!section || section.section_type !== 'table') return

    if (section.rows && rowIndex >= 0 && rowIndex < section.rows.length) {
      section.rows.splice(rowIndex, 1)
    }
  }

  /**
   * Save draft - saves current values without finalizing
   */
  async function saveDraft() {
    if (!currentSelectedDoc.value || !selectedDocDetail.value) return

    const newResultJson = buildResultJson()
    const newDetail = {
      ...selectedDocDetail.value.detail,
      newResultJson
    }
    const classification = calculateFamilyClassification(newDetail);

    // Apply classification results to detail
    newDetail.formSource = classification.formSource;
    newDetail.familyCategory = classification.familyCategory;
    newDetail.familyClass = classification.familyClass;
    newDetail.priorityIndicator = classification.priorityIndicator;
    newDetail.statePerson = classification.statePerson;
    updateDocumentValues(newDetail)
    delete newDetail.updatedBy
    delete newDetail.updatedAt
    delete newDetail.createdAt
    delete newDetail.createdBy
    try {
      await clientApi.api.postCaptureBatchBatchidDocDocidSaveDraft(
        currentBatchId.value,
        currentSelectedDoc.value.id,
        newDetail
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
    const newDetail = {
      ...selectedDocDetail.value.detail,
      newResultJson
    }
    const classification = calculateFamilyClassification(newDetail);

    // Apply classification results to detail
    newDetail.formSource = classification.formSource;
    newDetail.familyCategory = classification.familyCategory;
    newDetail.familyClass = classification.familyClass;
    newDetail.priorityIndicator = classification.priorityIndicator;
    newDetail.statePerson = classification.statePerson;
    updateDocumentValues(newDetail)
    delete newDetail.updatedBy
    delete newDetail.updatedAt
    delete newDetail.createdAt
    delete newDetail.createdBy
    try {
      await clientApi.api.postCaptureBatchBatchidDocDocidConfirm(
        currentBatchId.value,
        currentSelectedDoc.value.id,
        newDetail
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

    // Find the section in the current settings
    // const sectionIndex = settings.section?.findIndex((s: any) => s.section_id === sectionId)
    if (!selectedDocDetail.value.detail.zoneResizeConfig) {
      selectedDocDetail.value.detail.zoneResizeConfig = {}
    }
    selectedDocDetail.value.setting.fieldsSetting.section?.forEach((section) => {
      if (selectedDocDetail.value.detail.zoneResizeConfig[section.section_id]) {

        section.zone = newZone
      }
    })
    selectedDocDetail.value.detail.zoneResizeConfig[sectionId] = newZone

    const index = sectionsWithValues.value.findIndex(s => s.section_id === sectionId)

    if (index !== -1) {
      sectionsWithValues.value[index].zone = newZone
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
    removeTableRow,
    saveDraft,
    confirm,
    reload: getBatchDetail,
    updateSectionZone,
    buildResultJson
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



/**
 * Part 1: Normalize document data
 * - Remove parentheses from HKID and ApplicantChineseName fields in result JSON
 * - Apply zoneResizeConfig to settings sections
 */
export function normalizeDocumentData(detail: any, setting: any): void {
  // Normalize newResultJson - remove parentheses from HKID and ApplicantChineseName
  if (detail.newResultJson) {
    Object.keys(detail.newResultJson).forEach((sectionKey) => {
      const section = detail.newResultJson[sectionKey]

      if (Array.isArray(section)) {
        section.forEach((item) => {
          Object.keys(item).forEach((fieldKey) => {
            if (fieldKey.includes('HKID') || fieldKey.includes('HKIC') || fieldKey === 'ApplicantChineseName' || fieldKey === 'FamilyMemberChineseName') {

              item[fieldKey] = item[fieldKey].replaceAll('(', '').replaceAll(')', '')
            }
          })
        })
      } else {

        Object.keys(section).forEach((fieldKey) => {
          if (fieldKey.includes('HKID') || fieldKey.includes('HKIC') || fieldKey === 'ApplicantChineseName'  || fieldKey === 'FamilyMemberChineseName') {

            detail.newResultJson[sectionKey][fieldKey] = detail.newResultJson[sectionKey][fieldKey].replaceAll('(', '').replaceAll(')', '')
          }
        })
      }
    })
  }

  // Normalize oldResultJson - remove parentheses from HKID and ApplicantChineseName
  if (detail.oldResultJson) {
    Object.keys(detail.oldResultJson).forEach((sectionKey) => {
      const section = detail.oldResultJson[sectionKey]
      if (Array.isArray(section)) {
        section.forEach((item) => {
          Object.keys(item).forEach((fieldKey) => {
            if (fieldKey.includes('HKID') || fieldKey.includes('HKIC') || fieldKey === 'ApplicantChineseName' || fieldKey === 'FamilyMemberChineseName') {

              item[fieldKey] = item[fieldKey].replaceAll('(', '').replaceAll(')', '')
            }
          })
        })
      } else {
        Object.keys(section).forEach((fieldKey) => {
          if (fieldKey.includes('HKID') || fieldKey.includes('HKIC') || fieldKey === 'ApplicantChineseName' || fieldKey === 'FamilyMemberChineseName') {
            detail.oldResultJson[sectionKey][fieldKey] = detail.oldResultJson[sectionKey][fieldKey].replaceAll('(', '').replaceAll(')', '')
          }
        })
      }
    })
  }

  // Convert section zoneResizeConfig to settings section
  if (detail.zoneResizeConfig) {
    setting.fieldsSetting.section?.forEach((section: any) => {
      if (detail.zoneResizeConfig[section.section_id]) {
        section.zone = detail.zoneResizeConfig[section.section_id]
      }
    })
  }
}

/**
 * Part 2: Calculate family classification
 * - Calculate family category, class, priority indicator, and form source
 * - Based on form type (Green/White), priority schemes, and specific fields
 */
export function calculateFamilyClassification(detail: any): {
  familyCategory: string
  familyClass: string
  priorityIndicator: string
  formSource: string
  statePerson: string
} {
  const { PrioritySchemeForElderly = 'N', PrioritySchemeForNewborns =
    'N', YouthSchema = 'N' } = detail.newResultJson?.PriorityScheme || {}
  const { HKHS = 'N', HA = 'N', EFAS = 'N', CotForEfasApplication: EFAS_COT, CleareesCat } = detail.newResultJson?.SpecificField || {}
  const pplCount: number = (detail.newResultJson?.ApplicantFamilyMemberList?.length || 0) + 1;
  const hasFamilyMember = detail.newResultJson?.ApplicantFamilyMemberList?.length > 0;

  let babyCount: number = detail.newResultJson?.ApplicantFamilyMemberList?.reduce((acc: number, curr: any) => {
    if (curr.FamilyMemberPregnanted16Week === 'Y') {
      return acc + 1
    }
    return acc
  }, 0) || 0

  // Check if applicant has babyCount
  if (detail.newResultJson?.['Applicant Info']?.ApplicantFemalePregnanted16week === 'Y') {
    babyCount++
  }
  console.log({
    pplCount,
    hasFamilyMember,
    PrioritySchemeForElderly,
    PrioritySchemeForNewborns,
    YouthSchema,
    babyCount,
    CleareesCat,
    HKHS,
    HA,
    EFAS_COT,
    EFAS,
    formTypeCode: detail.formTypeCode,
    detail
  })
  let FamilyClass = "";
  let FamilyCategory = "";
  let PriorityIndicator = '';
  let FormSource = "";

  // Helper to check if EFAS date is after 14/4/2023
  const isEfasAfterTargetDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const EFAS_date = dayjs(dateStr, 'DD/MM/YYYY', true);
    const Target_date = dayjs('14/04/2023', 'DD/MM/YYYY', true);
    if (!EFAS_date.isValid()) return false;
    return EFAS_date.isAfter(Target_date);
  };

  // Helper to check if Clearees category matches
  const isCat = (cat: string): boolean => CleareesCat === `Cat. ${cat}`;

  const elderly = PrioritySchemeForElderly === 'Y';
  const newborn = PrioritySchemeForNewborns === 'Y';
  const youth = YouthSchema === 'Y';

  if (detail.formTypeCode === 'G') {
    // Green Form logic
    if (hasFamilyMember) {
      // Family with members (pplCount > 1)
      if (HKHS === 'N') {
        if (HA === 'Y' && (!CleareesCat || CleareesCat === '')) {
          // HA Green Form Family (no CleareesCat)
          if (EFAS === 'Y' && isEfasAfterTargetDate(EFAS_COT)) {
            // EFAS with date after 14/4/2023
            if (elderly && newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "1S - GF EFAS Elderly & NB";
              PriorityIndicator = "Elderly & Newborns";
            } else if (elderly) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "1S - GF EFAS Elderly & NB";
              PriorityIndicator = "Elderly";
            } else if (newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "1S - GF EFAS Elderly & NB";
              PriorityIndicator = "Newborns";
            } else {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "3E - GF EFAS";
              PriorityIndicator = "";
            }
            FormSource = "HA - HA Green";
          } else {
            // Regular HA
            if (elderly && newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "2N - GF HA Elderly & NB";
              PriorityIndicator = "Elderly & Newborns";
            } else if (elderly) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "2N - GF HA Elderly & NB";
              PriorityIndicator = "Elderly";
            } else if (newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "2N - GF HA Elderly & NB";
              PriorityIndicator = "Newborns";
            } else {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "8 - GF HA";
              PriorityIndicator = "";
            }
            FormSource = "HA - HA Green";
          }
        } else if (HA === 'Y' && isCat('1')) {
          // HA with Cat. 1
          FamilyCategory = "GF - Green Family";
          FamilyClass = "9 - GF 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (HA === 'Y' && isCat('2')) {
          // HA with Cat. 2
          FamilyCategory = "GF - Green Family";
          FamilyClass = "11 - GF 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (HA === 'Y' && isCat('3')) {
          // HA with Cat. 3
          FamilyCategory = "GF - Green Family";
          FamilyClass = "11 - GF 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if ((HA === 'Y' && isCat('4')) || HA !== 'Y') {
          // HS Green Form: HA with Cat. 4, or not HA
          if (!CleareesCat || CleareesCat === '' || isCat('1')) {
            if (elderly && newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "4N - GF HS Elderly & NB";
              PriorityIndicator = "Elderly & Newborns";
            } else if (elderly) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "4N - GF HS Elderly & NB";
              PriorityIndicator = "Elderly";
            } else if (newborn) {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "4N - GF HS Elderly & NB";
              PriorityIndicator = "Newborns";
            } else {
              FamilyCategory = "GF - Green Family";
              FamilyClass = "4 - GF HS";
              PriorityIndicator = "";
            }
            FormSource = "HS - HS Green";
          } else if (isCat('2')) {
            FamilyCategory = "GS - Green Single";
            FamilyClass = "10 - GS 1st Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('3')) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "11 - GF 2nd Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('4')) {
            FamilyCategory = "GS - Green Single";
            FamilyClass = "12 - GS 2nd Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          }
        }
      } else {
        // HKHS === 'Y'
        if (!CleareesCat || CleareesCat === '') {
          if (elderly && newborn) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "3N - GF Cert Elderly & NB";
            PriorityIndicator = "Elderly & Newborns";
          } else if (elderly) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "3N - GF Cert Elderly & NB";
            PriorityIndicator = "Elderly";
          } else if (newborn) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "3N - GF Cert Elderly & NB";
            PriorityIndicator = "Newborns";
          } else {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "3 - GF Cert";
            PriorityIndicator = "";
          }
          FormSource = "GC - GCert";
        } else if (isCat('1')) {
          FamilyCategory = "GF - Green Family";
          FamilyClass = "9 - GF 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('2')) {
          FamilyCategory = "GS - Green Single";
          FamilyClass = "10 - GS 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('3')) {
          FamilyCategory = "GF - Green Family";
          FamilyClass = "11 - GF 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('4')) {
          FamilyCategory = "GS - Green Single";
          FamilyClass = "12 - GS 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        }
      }
    } else {
      // Single person (pplCount === 1)
      if (HKHS === 'N') {
        if (HA === 'Y') {
          if (!CleareesCat || CleareesCat === '') {
            if (EFAS === 'Y' && isEfasAfterTargetDate(EFAS_COT)) {
              FamilyCategory = "WS - White Single";
              FamilyClass = "5E - GS EFAS";
              PriorityIndicator = "";
              FormSource = "HA - HA Green";
            } else {
              FamilyCategory = "GS - Green Single";
              FamilyClass = "6 - GS HA";
              PriorityIndicator = "";
              FormSource = "HA - HA Green";
            }
          }
        } else {
          // Not HA - check Clearees category
          if (!CleareesCat || CleareesCat === '') {
            FamilyCategory = "GS - Green Single";
            FamilyClass = "7 - GS Cert";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('1')) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "9 - GF 1st Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('2')) {
            FamilyCategory = "GS - Green Single";
            FamilyClass = "10 - GS 1st Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('3')) {
            FamilyCategory = "GF - Green Family";
            FamilyClass = "11 - GF 2nd Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          } else if (isCat('4')) {
            FamilyCategory = "GS - Green Single";
            FamilyClass = "12 - GS 2nd Absolute Priority";
            PriorityIndicator = "";
            FormSource = "HS - HS Green";
          }
        }
      } else {
        // HKHS === 'Y'
        if (!CleareesCat || CleareesCat === '') {
          FamilyCategory = "GS - Green Single";
          FamilyClass = "8 - GS HS";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('1')) {
          FamilyCategory = "GF - Green Family";
          FamilyClass = "9 - GF 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('2')) {
          FamilyCategory = "GS - Green Single";
          FamilyClass = "10 - GS 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('3')) {
          FamilyCategory = "GF - Green Family";
          FamilyClass = "11 - GF 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        } else if (isCat('4')) {
          FamilyCategory = "GS - Green Single";
          FamilyClass = "12 - GS 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = "HS - HS Green";
        }
      }
    }
  }
  console.log({
    FamilyCategory,
    FamilyClass,
    PriorityIndicator,
    FormSource,
  })
  if (detail.formTypeCode === 'W') {
    // White Form logic
    if (hasFamilyMember) {
      // Family with members
      if (elderly && newborn) {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Elderly & Newborns";
      } else if (elderly) {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Elderly";
      } else if (newborn) {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Newborns";
      } else if (youth) {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1Y - WF Youth";
        PriorityIndicator = "";
      } else {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1 - WF";
        PriorityIndicator = "";
      }
    } else {
      // Single person
      if (youth) {
        FamilyCategory = "WS - White Single";
        FamilyClass = "5Y - WS Youth";
        PriorityIndicator = "";
      } else {
        FamilyCategory = "WS - White Single";
        FamilyClass = "5 - WS";
        PriorityIndicator = "";
      }
    }
    FormSource = "-";
  }

  const Person = pplCount + ' + ' + babyCount;

  return {
    familyCategory: FamilyCategory,
    familyClass: FamilyClass,
    priorityIndicator: PriorityIndicator,
    formSource: FormSource,
    statePerson: Person
  };
}

/**
 * Part 3: Update document values
 * - Update oldValue if it contains [formClass] placeholder
 * - Build newValue string with applicant info and family class
 */
export function updateDocumentValues(detail: any): void {
  // Update oldValue - replace [formClass] placeholder if present
  if (detail.oldValue?.includes('[formClass]')) {
    detail.oldValue = detail.oldValue.replace('[formClass]', detail.familyClass);
  }

  // Build newValue: <appln no>&<family type>&<ahkid>&<hkic1>&<hkic2>&<hkic3>&<hkicx>&<PaymentReference>&<family class>
  const appl_no = detail.applicantNum
  const ahkid = detail.newResultJson?.['Applicant Info']?.ApplicantHKID
  const hkics = detail.newResultJson?.ApplicantFamilyMemberList?.map((cur: any) => cur.FamilyMemberHKID || '') || []
  const PaymentReference = detail.newResultJson?.Payment?.PaymentReference
  detail.newValue = `${appl_no}&${detail.formTypeCode}&${ahkid}&${hkics.join('&')}&${PaymentReference}&${detail.familyClass}`;
}

/**
 * Main document initialization function
 * Combines all 3 parts: normalization, classification, and value updates
 */
function DocumentInitFunctionBackup(detail: any, setting: any) {
  // Part 1: Normalize document data
  normalizeDocumentData(detail, setting);


  // Part 2: Calculate family classification
  const classification = calculateFamilyClassification(detail);

  // Apply classification results to detail
  detail.formSource = classification.formSource;
  detail.familyCategory = classification.familyCategory;
  detail.familyClass = classification.familyClass;
  detail.priorityIndicator = classification.priorityIndicator;
  detail.statePerson = classification.statePerson;

  // Part 3: Update document values
  updateDocumentValues(detail);
  return {
    detail,
    setting
  };
}
