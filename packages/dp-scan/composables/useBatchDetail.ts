import { clientApi } from 'api'
import { normalizeValue, createValidator, type NormalizeOptions, type ValidationFunction } from '../types/formOCR'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type {HighlightedParams, ZoneObject, FieldWithValue, SectionWithValues, BatchDetailContext, SectionParams} from '#imports'
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
  const sectionFormRef = ref()

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

  // End State



  function convertFieldToWithValues(field:any, newData: Record<string, any>, oldData: Record<string, any> | undefined) :FieldWithValue {
    const fieldLabel = field.lable || field.label

    const rawValue = newData?.[fieldLabel] ?? field.default_value ?? ''

    let normalizedValue = field.normalize_options || ( field.field_setting && field.field_setting.options)
      ? normalizeValue(rawValue, field.field_setting.options, field.normalize_options, true)
      : rawValue
    if (!normalizedValue && field.default_value) {
      normalizedValue = field.default_value
    }
    const normalizeOldValue = field.normalize_options || ( field.field_setting && field.field_setting.options)
      ? normalizeValue(oldData?.[fieldLabel], field.field_setting.options, field.normalize_options)
      : oldData?.[fieldLabel]

    if (field.type === 'hkic') {
      const isValue = checkHKID(rawValue)
      field.warning = isValue ? isValue.message : undefined
    }
    if (field.default_value) {
      console.log("default value", field.default_value, normalizedValue, normalizeOldValue)
    }
    const result = {
      ...field,
      currentValue: normalizedValue,
      originalValue: normalizeOldValue,
      options: field.field_setting?.options?.map((opt: Record<string, string>) => {
        const [value, label] = Object.entries(opt)[0] || ['', '']
        return { value: value === 'none' ? '' : value, label }
      }),
      normalize_options: field.normalize_options,
      validation_function: field.validation_function
    }

    return result
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
              const newField = convertFieldToWithValues(field, rowData, oldRowData)

              return newField
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
            currentValue: field.default_value ?? '',
            originalValue: '',
            options: field.field_setting?.options?.map((opt: Record<string, string>) => {
              const [value, label] = Object.entries(opt)[0] || ['', '']
              return { value: value === 'none' ? '' : value, label }
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
            // if (fieldLabel === "FamilyMemberMaritalStatus") {
            //   console.log("FamilyMemberMaritalStatus", field)
            // }
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



  async function getBatchDetail(selectIndex?:number) {
    detailLoading.value = true
    isLockedByOther.value = false
    lockedByUser.value = undefined
    try {
      const response = await clientApi.api.getCaptureBatchBatchidDetail(currentBatchId.value)
      batchDetail.value = response.data
      batchDetail.value.documents = batchDetail.value.documents.sort((a, b) => a.originalFilename.localeCompare(b.originalFilename))
      previewImgUrl.value = null
      currentSelectedDoc.value = response.data.documents[selectIndex || 0]
      currentPageNumber.value = 1;
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
    // highlightedSection.value = undefined
    // highlightedField.value = undefined

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

  async function downloadImage(path: string, cancelLast:boolean = true): Promise<Blob> {
    // Cancel any previous request
    if (cancelLast) {

      cancelImageRequest()
    }

    // Create new abort controller for this request
    currentImageAbortController = new AbortController()

    try {
      const b = await clientApi.api.postCaptureFileQuerycapturefilebypath({ path }, {
        format: 'blob',
        timeout: 0,
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
   * Parse zone string "x1,y1,x2,y2" to coordinates object
   */
  function parseZoneString(zone: string): { x: number; y: number; width: number; height: number } | null {
    if (!zone) return null
    const coords = zone.split(',').map(Number)
    if (coords.length === 4) {
      return {
        x: coords[0],
        y: coords[1],
        width: coords[2] - coords[0],
        height: coords[3] - coords[1]
      }
    }
    return null
  }



  /**
   * Get a cropped image of a specific section without changing the current page view
   * Downloads the page image, extracts the crop based on zone coordinates, and returns base64
   * @param section - Section parameters with page number and zone coordinates "x1,y1,x2,y2"
   * @returns Base64 image data URL (png format) of the cropped section, or undefined if failed
   * @example
   * const base64Image = await getCropImageBySection({ page: 1, zone: "95,2344,1258,2753" })
   */
  async function getCropImageBySection(section: SectionParams): Promise<string | undefined> {
    if (!section?.page || !section?.zone) {
      console.warn('getCropImageBySection: Invalid section parameters', section)
      return undefined
    }

    // Validate zone format
    const zoneCoords = parseZoneString(section.zone)
    if (!zoneCoords) {
      console.warn('getCropImageBySection: Invalid zone format', section.zone)
      return undefined
    }

    // Validate page number
    const totalPageCount = selectedDocDetail.value?.detail?.pages?.length || 0
    if (section.page < 1 || section.page > totalPageCount) {
      console.warn('getCropImageBySection: Page number out of range', section.page, totalPageCount)
      return undefined
    }

    try {
      // Get the image URL for the specified page
      const url = selectedDocDetail.value?.detail?.pages?.[section.page - 1]
      if (!url) {
        console.warn('getCropImageBySection: No image URL found for page', section.page)
        return undefined
      }

      // Download the image blob
      const blob = await downloadImage(url, false)
      if (blob.size === 0) {
        console.warn('getCropImageBySection: Failed to download image or request was aborted')
        return undefined
      }

      // Convert blob to object URL for image loading
      const imageUrl = URL.createObjectURL(blob)

      try {
        // Load image and extract crop in memory
        return await new Promise<string | undefined>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'

          img.onload = () => {
            try {
              // Create a temporary canvas to extract the crop
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = zoneCoords.width
              tempCanvas.height = zoneCoords.height
              const tempCtx = tempCanvas.getContext('2d')

              if (!tempCtx) {
                resolve(undefined)
                return
              }

              // Draw the cropped area from the source image
              tempCtx.drawImage(
                img,
                zoneCoords.x, zoneCoords.y, zoneCoords.width, zoneCoords.height,  // Source coordinates
                0, 0, zoneCoords.width, zoneCoords.height  // Destination coordinates
              )

              // Convert to base64 PNG
              const imageData = tempCanvas.toDataURL('image/png')
              resolve(imageData)
            } catch (error) {
              console.error('getCropImageBySection: Failed to extract crop', error)
              resolve(undefined)
            } finally {
              // Clean up the object URL
              URL.revokeObjectURL(imageUrl)
            }
          }

          img.onerror = () => {
            console.error('getCropImageBySection: Failed to load image')
            URL.revokeObjectURL(imageUrl)
            resolve(undefined)
          }

          img.src = imageUrl
        })
      } catch (error) {
        // Clean up on error
        URL.revokeObjectURL(imageUrl)
        throw error
      }
    } catch (error) {
      console.error('getCropImageBySection: Failed to get crop image', error)
      return undefined
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
    const classification = familyClassCalulation(newDetail);

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
    const classification = familyClassCalulation(newDetail);

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
      // TODO : Select Next Document, and reload page
      // TODO:　calculate selected document index
      const index = batchDetail.value.documents.findIndex((b) => b.id === currentSelectedDoc.value.id)

      if (index !== -1 ) {
        if (index === batchDetail.value.documents.length - 1) {
          // is last page
          await getBatchDetail(index)
        } else {
          await getBatchDetail(index + 1)
        }

      } else {
        await getBatchDetail()
      }


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
      selectedDocDetail.value.detail.zoneResizeConfig = { }
    }
    selectedDocDetail.value.setting.fieldsSetting.section?.forEach((section) => {
      if (selectedDocDetail.value.detail.zoneResizeConfig[section.section_id] && selectedDocDetail.value.detail.zoneResizeConfig[section.section_id].zone) {

        section.zone = newZone
      }
    })
    selectedDocDetail.value.detail.zoneResizeConfig[sectionId] = {
      zone: newZone
    }

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
    getCropImageBySection,
    updateSectionZone,
    buildResultJson,

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
      // highlightedSection.value = undefined
      // highlightedField.value = undefined
      getDocumentDetail(currentSelectedDoc.value.id)
    }
  })

  // Watch for selectedDocDetail changes and rebuild sectionsWithValues if user select another
  watch(selectedDocDetail, (newValue, oldValue) => {
    if (selectedDocDetail.value && (!oldValue || newValue.detail.id !== oldValue.detail.id)) {
      buildSectionsWithValues()
      setupPreview()
    }
  }, { deep: true })

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
            // check if value is a DOB

            if (fieldKey.includes('DOB')) {
               console.log("DOB", fieldKey, item)
              // check if is a valid DD/MM/YYYY , if not make it YYYY-MM-DD
              const dateStr = item[fieldKey]
              const dateParts = dateStr.split('/')
              // check if dateParts length is 3
              if (dateParts.length !== 3) {
                item[fieldKey] = ''
              }
              //check if MM　is equal or small than 12
              if (parseInt(dateParts[1]) > 12) {
                item[fieldKey] = ''

              }

            }
          })
        })
      } else {

        Object.keys(section).forEach((fieldKey) => {
          // check if value is a DOB
          if (fieldKey.includes('DOB')) {
            // check if is a valid DD/MM/YYYY , if not make it YYYY-MM-DD
            const dateStr = detail.newResultJson[sectionKey][fieldKey]
            const dateParts = dateStr.split('/')
            // check if dateParts length is 3
            if (dateParts.length !== 3) {
              detail.newResultJson[sectionKey][fieldKey] = ''
            }
            //check if MM　is equal or small than 12
            if (parseInt(dateParts[1]) > 12) {
              detail.newResultJson[sectionKey][fieldKey] = ''
            }

          }
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
      if (detail.zoneResizeConfig[section.section_id] && detail.zoneResizeConfig[section.section_id].zone) {
        section.zone = detail.zoneResizeConfig[section.section_id].zone
      }
    })
  }
}



export type FamilyClassReturn = {
  familyCategory: string
  familyClass: string
  priorityIndicator: string
  formSource: string
  statePerson: string
}
export function familyClassCalulation(detail: any): FamilyClassReturn {
  console.log("familyClassCalulation run", detail)
  // get all params needed.
  let { PrioritySchemeForElderly = 'N', PrioritySchemeForNewborns =
    'N', YouthScheme = 'N' } = detail.newResultJson?.PriorityScheme || {}
  const { HKHS = 'N', HA = 'N', EFAS = 'N', CotForEfasApplication: EFAS_COT, CleareesCat, 'EMMS Code': emms } = detail.newResultJson?.SpecificField || {}
  const formType: "G" | "W" = detail.formTypeCode
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
  const totalFamilySize = pplCount + babyCount
  // init return value
  let FamilyClass = "";
  let FamilyCategory = "";
  let PriorityIndicator = '';
  let FormSource = "";
  const Person = pplCount + ' + ' + babyCount;

  // Helper to check if EFAS date is after 14/4/2023
  const isEfasAfterTargetDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const EFAS_date = dayjs(dateStr, 'DD/MM/YYYY', true);
    const Target_date = dayjs('14/04/2023', 'DD/MM/YYYY', true);
    if (!EFAS_date.isValid()) return false;
    return EFAS_date.isAfter(Target_date);
  };
  // Helper to check if Clearees category matches
  const isCat = (cat: string): boolean => CleareesCat === `Cat ${cat}` || CleareesCat === cat;

  // check logic

  // step 1 , check White form
  if (formType === 'W') {
    // check if form has more than 1 totalFamilySize(pplCount + babyCount)

    if (totalFamilySize === 1) {
      // checking column G - H
      // check if Applicant has YouthScheme
      if (YouthScheme === 'Y') {
        // column G
        FamilyCategory = "WS - White Single";
        FamilyClass = "5Y - WS Youth";
      } else {
        // column H
        FamilyCategory = "WS - White Single";
        FamilyClass = "5 - WS";
      }
    } else {
      // column B - F
      // 1 check column F , if PrioritySchemeForElderly, PrioritySchemeForNewborns and Youth Scheme is N
      if (PrioritySchemeForElderly === 'N' && PrioritySchemeForNewborns === 'N' && YouthScheme === 'N') {
        FamilyCategory = "WF- White Family";
        FamilyClass = "1 - WF";
      } else if (YouthScheme === 'Y') {
        // column E PrioritySchemeForElderly, PrioritySchemeForNewborns is N and Youth Scheme is Y
        FamilyCategory = "WF- White Family";
        FamilyClass = "1Y - WF Youth";
      } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'Y' && YouthScheme === 'N') {
        // column B, PrioritySchemeForElderly, PrioritySchemeForNewborns is Y  and Youth Scheme is N
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Elderly & Newborns"
      } else if (PrioritySchemeForElderly === 'Y') {
        // column C PrioritySchemeForElderly is Y
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Elderly"
      } else if (PrioritySchemeForNewborns === 'Y') {
        // column D PrioritySchemeForNewborns is Y
        FamilyCategory = "WF- White Family";
        FamilyClass = "1N -WF Elderly & NB";
        PriorityIndicator = "Newborns"
      }
      // END column B - F
    }
    // END White form
  } else {
    // Green Form Logic
    // Layer 1 split by HKHS and HA
    if (HKHS === 'N' && HA === 'N') {
    // column AB - AF
      if (totalFamilySize === 1) {
        //column AF
        FamilyCategory = "GS - Green Single";
        FamilyClass = "7 - GS Cert";
        FormSource = 'GC - GCert'
      } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'Y') {
        // column AB
        FamilyCategory = "GF - Green Family";
        FamilyClass = "3N - GF Cert Elderly & NB";
        PriorityIndicator = "Elderly & Newborns";
        FormSource = 'GC - GCert';
      } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'N') {
        // column AC
        FamilyCategory = "GF - Green Family";
        FamilyClass = "3N - GF Cert Elderly & NB";
        PriorityIndicator = "Elderly";
        FormSource = 'GC - GCert';
      } else if (PrioritySchemeForElderly === 'N' && PrioritySchemeForNewborns === 'Y') {
        // column AD
        FamilyCategory = "GF - Green Family";
        FamilyClass = "3N - GF Cert Elderly & NB";
        PriorityIndicator = "Newborns";
        FormSource = 'GC - GCert';
      } else {
        // column AE
        FamilyCategory = "GF - Green Family";
        FamilyClass = "3 - GF Cert";
        PriorityIndicator = "";
        FormSource = 'GC - GCert';
      }
      // END Column AB -AF
    } else if (HKHS === 'Y') {
      // HKHS = Y
      // column S - AA
      if (totalFamilySize === 1) {
        // column Y - AA
        if(isCat('1') || isCat('3')) {
          // column AA
          FamilyCategory = "GS - Green Single";
          FamilyClass = "";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        } else if (isCat('2')) {
          // column Y
          FamilyCategory = "GS - Green Single";
          FamilyClass = "10 - GS 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        } else if (isCat('4')) {
          // column Z
          FamilyCategory = "GS - Green Single";
          FamilyClass = "12 - GS 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        } else  {
          // column AA
          FamilyCategory = "GS - Green Single";
          FamilyClass = "8 - GS HS";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        }

        // END column Y- AA
      } else {
        // column S - X
        if (isCat('2') || isCat('4')) {
          FamilyCategory = "GF - Green Family";
          FamilyClass = "";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        }else if (isCat('1')) {
          // column S
          FamilyCategory = "GF - Green Family";
          FamilyClass = "9 - GF 1st Absolute Priority";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        } else if (isCat('3')) {
          // column T
          FamilyCategory = "GF - Green Family";
          FamilyClass = "11 - GF 2nd Absolute Priority";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'Y') {
          // column U
          FamilyCategory = "GF - Green Family";
          FamilyClass = "4N - GF HS Elderly & NB";
          PriorityIndicator = "Elderly & Newborns";
          FormSource = 'HS - HS Green';
        } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'N') {
          // column V
          FamilyCategory = "GF - Green Family";
          FamilyClass = "4N - GF HS Elderly & NB";
          PriorityIndicator = "Elderly";
          FormSource = 'HS - HS Green';
        } else if (PrioritySchemeForNewborns === 'Y' && PrioritySchemeForElderly === 'N') {
          // column W
          FamilyCategory = "GF - Green Family";
          FamilyClass = "4N - GF HS Elderly & NB";
          PriorityIndicator = "Newborns";
          FormSource = 'HS - HS Green';
        } else {
          // column X
          FamilyCategory = "GF - Green Family";
          FamilyClass = "4 - GF HS";
          PriorityIndicator = "";
          FormSource = 'HS - HS Green';
        }
        // END column S - X
      }
      // END HKHS Y
    } else if (HA === 'Y') {
    // column I - R
      if (EFAS === 'Y' && isEfasAfterTargetDate(EFAS_COT)) {
        // column I - M
        if (totalFamilySize === 1) {
          // column M
          FamilyCategory = "WS - White Single";
          FamilyClass = "5E - GS EFAS";
          PriorityIndicator = "";
          FormSource = 'HA - HA Green';
        }else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'Y') {
          // column I
          FamilyCategory = "WF- White Family";
          FamilyClass = "1S - GF EFAS Elderly & NB";
          PriorityIndicator = "Elderly & Newborns";
          FormSource = 'HA - HA Green';
        } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'N') {
          // column j
          FamilyCategory = "WF- White Family";
          FamilyClass = "1S - GF EFAS Elderly & NB";
          PriorityIndicator = "Elderly";
          FormSource = 'HA - HA Green';
        } else if (PrioritySchemeForElderly === 'N' && PrioritySchemeForNewborns === 'Y') {
          // column k
          FamilyCategory = "WF- White Family";
          FamilyClass = "1S - GF EFAS Elderly & NB";
          PriorityIndicator = "Newborns";
          FormSource = 'HA - HA Green';
        } else {
          FamilyCategory = "WF- White Family";
          FamilyClass = "1E - GF EFAS";
          PriorityIndicator = "";
          FormSource = 'HA - HA Green';
        }
        // END column I -M
      } else {
        // column N -R
        if (totalFamilySize === 1) {
           // column R
           FamilyCategory = "GS - Green Single";
           FamilyClass = "6 - GS HA";
           PriorityIndicator = "";
           FormSource = 'HA - HA Green';
        } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'Y'){
          // column  N
          FamilyCategory = "GF - Green Family";
          FamilyClass = "2N - GF HA Elderly & NB";
          PriorityIndicator = "Elderly & Newborns";
          FormSource = 'HA - HA Green';
         } else if (PrioritySchemeForElderly === 'Y' && PrioritySchemeForNewborns === 'N') {
           // column O
           FamilyCategory = "GF - Green Family";
           FamilyClass = "2N - GF HA Elderly & NB";
           PriorityIndicator = "Elderly";
           FormSource = 'HA - HA Green';
         } else if (PrioritySchemeForElderly === 'N' && PrioritySchemeForNewborns === 'Y') {
           // column P
           FamilyCategory = "GF - Green Family";
           FamilyClass = "2N - GF HA Elderly & NB";
           PriorityIndicator = "Newborns";
           FormSource = 'HA - HA Green';
        } else {
          // column Q
           FamilyCategory = "GF - Green Family";
           FamilyClass = "2 - GF HA";
           PriorityIndicator = "";
           FormSource = 'HA - HA Green';
         }
      }
    }
    // END GReen From
  }

  const result = {
    familyCategory: FamilyCategory,
    familyClass: FamilyClass,
    priorityIndicator: PriorityIndicator,
    formSource: FormSource,
    statePerson: Person
  }

  return result;
}


/**
 * Part 3: Update document values
 * - Update oldValue if it contains [formClass] placeholder
 * - Build newValue string with applicant info and family class
 */
export function updateDocumentValues(detail: any): void {
  // Update oldValue - replace [formClass] placeholder if present
  if (detail.oldValue?.includes('[formClass]')) {
    const displayFamilyClass = detail.familyClass ? detail.familyClass.split('-')[0].trim() : ''
    detail.oldValue = detail.oldValue.replace('[formClass]', displayFamilyClass);
  }
  detail.oldValue = detail.oldValue?.replaceAll('(', '').replaceAll(')', '');
  // Build newValue: <appln no>&<family type>&<ahkid>&<hkic1>&<hkic2>&<hkic3>&<hkicx>&<PaymentReference>&<family class>
  const appl_no = detail.applicantNum
  const ahkid = detail.newResultJson?.['Applicant Info']?.ApplicantHKID
  const hkics = detail.newResultJson?.ApplicantFamilyMemberList?.map((cur: any) => cur.FamilyMemberHKID || '') || []
  const PaymentReference = detail.newResultJson?.Payment?.PaymentReference
  const displayFamilyClass = detail.familyClass ? detail.familyClass.split('-')[0].trim() : ''
  detail.newValue = `${appl_no}&${detail.formTypeCode}&${ahkid}&${hkics.join('&')}&${PaymentReference}&${displayFamilyClass}`;
}

/**
 * Main document initialization function
 * Combines all 3 parts: normalization, classification, and value updates
 */
function DocumentInitFunctionBackup(detail: any, setting: any) {
  // Part 1: Normalize document data
  normalizeDocumentData(detail, setting);


  // Part 2: Calculate family classification
  const classification = familyClassCalulation(detail);

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
