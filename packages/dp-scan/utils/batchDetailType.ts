
import { type NormalizeOptions, type ValidationFunction } from '../types/formOCR'

export type HighlightedParams = {
  section_type?: string
  page: number // start from 1
  zone: string // 'topleft x,topleft y, bottom right x, bottom right y'
}

export type ZoneObject = {
  page: number
  zone: string
}

export type SectionParams = {
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
  getCropImageBySection: (section: SectionParams) => Promise<string | undefined>
}
