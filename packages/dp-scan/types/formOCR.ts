/**
 * Form OCR Types
 * Normalized types for HKHS form field settings
 */

// ==================== Common Types ====================

/**
 * Zone coordinates for crop areas
 * Format: "x1,y1,x2,y2" in pixels from top-left of the page
 */
export type ZoneString = string

/**
 * Zone object with page number and coordinates
 */
export interface Zone {
  /** Page number (1-indexed) */
  page: number
  /** Zone coordinates "x1,y1,x2,y2" */
  zone: ZoneString
}

/**
 * Field type options
 */
export type FieldType =
  | 'text'
  | 'select'
  | 'date'
  | 'hkic'
  | 'number'
  | 'checkbox'
  | 'radio'

/**
 * Section type options
 */
export type SectionType = 'standard' | 'table'

/**
 * Merge method for data handling
 */
export type MergeMethod = 'overwrite' | 'append'

/**
 * Export format options
 */
export type ExportFormat = 'xml' | 'json' | 'csv'

// ==================== Field Types ====================

/**
 * Select option for select/radio fields
 */
export interface SelectOption {
  /** Option value */
  [value: string]: string
}

/**
 * Normalization options for mapping OCR/input values to option values
 * Key = target value, Value = array of patterns (plain strings or regex patterns like "^pattern$")
 * Example: { "Y": ["Yes", "Y", "^[Yy]"], "N": ["No", "N", "^[Nn]"] }
 */
export type NormalizeOptions = Record<string, string[]>

/**
 * Field settings for special field types
 */
export interface FieldSetting {
  /** Options for select/radio fields */
  options?: SelectOption[]
  /** Min value for number fields */
  min?: number
  /** Max value for number fields */
  max?: number
  /** Step for number fields */
  step?: number
  /** Pattern for text validation */
  pattern?: string
  /** Placeholder text */
  placeholder?: string
}

/**
 * Validation function signature for custom field validation
 * Similar to Element Plus validator but with extra allData parameter
 * Signature: (rule, value, callback, allData) => void
 */
export type ValidationFunction = string

/**
 * Individual field definition within a section
 */
export interface Field {
  /** Unique field key */
  key: string
  /** Field type */
  type: FieldType
  /** Zone coordinates for this field */
  zone: Zone
  /** Display label */
  lable: string
  /** Whether OCR is needed for this field */
  need_ocr: boolean
  /** Whether field is required */
  required?: boolean
  /** Export column name */
  export_label: string
  /** Field-specific settings (options, etc.) */
  field_setting?: FieldSetting
  /** Date format for date fields (e.g., "DD/MM/YYYY") */
  format?: string
  /** Whether to support Simplified to Traditional Chinese conversion */
  support_chs_to_cht?: boolean
  /** Normalization options for mapping input values to option values */
  normalize_options?: NormalizeOptions
  /** Custom validation function code (signature: (rule, value, callback, allData) => void) */
  validation_function?: ValidationFunction
}

// ==================== Section Types ====================

/**
 * Section definition containing multiple fields
 */
export interface Section {
  /** Zone coordinates for the entire section (optional for some section types) */
  zone?: Zone
  /** Fields within this section */
  fields: Field[]
  /** Unique section ID */
  section_id: string
  /** Whether to crop and scan this section */
  corp_to_scan: boolean
  /** Export column name for the section */
  export_label: string
  /** Merge method for data handling */
  merge_method: MergeMethod
  /** Display name */
  section_name: string
  /** Section type */
  section_type: SectionType
  /** Whether to save to result */
  save_to_result: boolean
  /** Associated prompt template ID */
  prompt_template_id: string
}

// ==================== QRCode Types ====================

/**
 * QRCode/Barcode format types
 */
export type QRCodeFormat = 'qrcode' | 'data_matrix' | 'barcode'

/**
 * QRCode field definition for form identification
 */
export interface QRCodeField {
  /** Unique key */
  key: string
  /** Zone coordinates */
  zone?: Zone
  /** Display label */
  label: string
  /** Barcode format */
  format: QRCodeFormat
  /** Whether field is read-only */
  readonly: boolean
  /** Whether field is required */
  required: boolean
  /** Export column name */
  export_label: string
}

// ==================== Form Configuration ====================

/**
 * Index field configuration for form identification
 */
export interface IndexField {
  /** QRCode option key used for indexing */
  qrcode_option: string
}

/**
 * Complete form fields setting structure
 */
export interface FormFieldsSetting {
  /** QRCode fields for form identification */
  qrcode: QRCodeField[]
  /** Form sections containing fields */
  section: Section[]
  /** Form name */
  form_name: string
  /** Index field configuration */
  index_field: IndexField
  /** Export file format */
  export_format: ExportFormat
  /** Default prompt template ID */
  prompt_template_id: string
  /** Output file name template */
  out_file_name_template: string
  /** New document name template */
  new_document_name_tempate: string
  /** String to store the init logic to a form */
  custom_init_logic?:string
}

// ==================== API/Runtime Types ====================

/**
 * Simplified crop input for creating new crops
 */
export interface CropInput {
  id: string | number
  zone?: Zone
  color?: string
  [key: string]: any
}

/**
 * Crop item stored in component state
 */
export interface CropItem extends CropInput {
  x: number
  y: number
  width: number
  height: number
  color: string
  isEditing: boolean
}

/**
 * Crop output when confirmed
 */
export interface CropOutput {
  id: string | number
  zone: string  // "x1,y1,x2,y2" format
  color: string
  [key: string]: any
}

/**
 * Zone parsed from string to numbers
 */
export interface ParsedZone {
  x1: number
  y1: number
  x2: number
  y2: number
  page: number
}

// ==================== Helper Functions ====================

/**
 * Parse zone string to coordinates
 * @param zoneString - Format: "x1,y1,x2,y2"
 * @returns Parsed coordinates or null if invalid
 */
export function parseZoneString(zoneString: string): { x1: number; y1: number; x2: number; y2: number } | null {
  const parts = zoneString.split(',').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) {
    return null
  }
  return {
    x1: parts[0],
    y1: parts[1],
    x2: parts[2],
    y2: parts[3]
  }
}

/**
 * Convert Zone object to string format
 * @param zone - Zone object
 * @returns Zone string "x1,y1,x2,y2"
 */
export function zoneToString(zone: Zone): string {
  return zone.zone
}

/**
 * Convert coordinates to Zone object
 * @param x1 - Top-left X
 * @param y1 - Top-left Y
 * @param x2 - Bottom-right X
 * @param y2 - Bottom-right Y
 * @param page - Page number
 * @returns Zone object
 */
export function coordinatesToZone(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  page: number = 1
): Zone {
  return {
    page,
    zone: `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}`
  }
}

/**
 * Convert Zone to coordinates with dimensions
 * @param zone - Zone object
 * @returns Object with x, y, width, height
 */
export function zoneToCoordinates(zone: Zone): { x: number; y: number; width: number; height: number; page: number } {
  const parsed = parseZoneString(zone.zone)
  if (!parsed) {
    return { x: 0, y: 0, width: 0, height: 0, page: zone.page }
  }
  return {
    x: parsed.x1,
    y: parsed.y1,
    width: parsed.x2 - parsed.x1,
    height: parsed.y2 - parsed.y1,
    page: zone.page
  }
}

/**
 * Validate zone string format
 * @param zoneString - Zone string to validate
 * @returns Whether the string is valid
 */
export function isValidZoneString(zoneString: string): boolean {
  return parseZoneString(zoneString) !== null
}

/**
 * Create empty form fields setting
 * @returns Empty FormFieldsSetting
 */
export function createEmptyFormFieldsSetting(formDetail?:any): FormFieldsSetting {

  return {
    qrcode: [],
    section: [],
    form_name: formDetail?.name || '',
    index_field: { qrcode_option: '' },
    export_format: 'xml',
    prompt_template_id: '',
    out_file_name_template: '${batch_id}-${yyyy-mm-dd}',
    new_document_name_tempate: '${doc_id}-${yyyy-mm-dd}'
  }
}

/**
 * Generate unique key for section or field
 * @param prefix - Key prefix
 * @returns Unique key
 */
export function generateKey(prefix: string = 'key'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get default field by type
 * @param type - Field type
 * @returns Default field configuration
 */
export function getDefaultFieldByType(type: FieldType): Partial<Field> {
  const defaults: Record<FieldType, Partial<Field>> = {
    text: {
      type: 'text',
      need_ocr: true,
      required: false
    },
    select: {
      type: 'select',
      need_ocr: true,
      required: false,
      field_setting: { options: [] }
    },
    date: {
      type: 'date',
      need_ocr: true,
      required: false,
      format: 'DD/MM/YYYY'
    },
    hkic: {
      type: 'hkic',
      need_ocr: true,
      required: false
    },
    number: {
      type: 'number',
      need_ocr: true,
      required: false
    },
    checkbox: {
      type: 'checkbox',
      need_ocr: true,
      required: false
    },
    radio: {
      type: 'radio',
      need_ocr: true,
      required: false,
      field_setting: { options: [] }
    }
  }

  return defaults[type] || defaults.text
}

/**
 * Create empty section
 * @param sectionId - Section ID
 * @param sectionName - Section display name
 * @returns Empty Section
 */
export function createEmptySection(sectionId?: string, sectionName?: string): Section {
  return {
    section_id: sectionId || generateKey('section'),
    section_name: sectionName || 'New Section',
    section_type: 'standard',
    fields: [],
    corp_to_scan: true,
    save_to_result: false,
    export_label: '',
    merge_method: 'overwrite',
    prompt_template_id: '',
  }
}

/**
 * Create empty field
 * @param key - Field key
 * @param label - Field label
 * @param type - Field type
 * @returns Empty Field
 */
export function createEmptyField(
  key?: string,
  label?: string,
  type: FieldType = 'text'
): Field {
  return {
    key: key || generateKey('field'),
    label: label || 'New Field',
    export_label: label || 'New Field',
    type,
    need_ocr: true,
    required: false,
    ...getDefaultFieldByType(type)
  } as Field
}

/**
 * Create empty QRCode field
 * @param label - Display label
 * @returns Empty QRCodeField
 */
export function createEmptyQRCodeField(label?: string): QRCodeField {
  return {
    key: generateKey('qrcode'),
    label: label || 'QR Code',
    export_label: label || 'QR Code',
    format: 'qrcode',
    readonly: true,
    required: true,
  }
}

// ==================== Normalization & Validation ====================

/**
 * Normalize a value using normalize_options
 * @param value - Input value from OCR or user
 * @param normalizeOptions - Normalization mapping object
 * @returns Matched normalized value or original value if no match
 *
 * Example:
 *   normalizeValue("Yes", { "Y": ["Yes", "Y"], "N": ["No", "N"] }) → "Y"
 *   normalizeValue("y", { "Y": ["^[Yy]$"], "N": ["^[Nn]$"] }) → "Y"
 */
export function normalizeValue(
  value: string,
  normalizeOptions?: NormalizeOptions
): string {
  if (!normalizeOptions || !value) return value

  const input = String(value).trim()

  for (const [targetValue, patterns] of Object.entries(normalizeOptions)) {
    for (const pattern of patterns) {
      // Check if pattern looks like a regex (starts with ^ or ends with $ or contains regex chars)
      const isRegex = pattern.startsWith('^') ||
                      pattern.endsWith('$') ||
                      /[.*+?()[\]{}|]/.test(pattern)
      if (pattern === '****') {
        return targetValue
      }
      if (isRegex) {
        try {
          const regex = new RegExp(pattern, 'i') // case-insensitive
          console.log("regex", regex, input)
          if (regex.test(input)) {
            return targetValue
          }
        } catch (e) {
          // Invalid regex, treat as literal string
          if (input.toLowerCase() === pattern.toLowerCase()) {
            return targetValue
          }
        }
      } else {
        // Plain string comparison (case-insensitive)
        if (input.toLowerCase() === pattern.toLowerCase()) {
          return targetValue
        }
      }
    }
  }

  // No match found, return original value
  return value
}

/**
 * Create a validator function from validation_function string
 * @param validationCode - Validation function code as string
 * @returns Validator function compatible with Element Plus form
 *
 * Usage in Element Plus form:
 *   const rules = {
 *     field: [{ validator: createValidator(field.validation_function), trigger: 'blur' }]
 *   }
 */
export function createValidator(
  validationCode?: ValidationFunction
): (rule: any, value: any, callback: (error?: Error) => void, allData?: any, SectionWithValues?:any) => void {
  if (!validationCode) {
    return (_rule: any, _value: any, callback: (error?: Error) => void) => callback()
  }

  return (rule: any, value: any, callback: (error?: Error) => void, allData?: any, SectionWithValues?:any) => {
    try {
      // Create function with proper signature
      const fn = new Function('rule', 'value', 'callback', 'allData', 'SectionWithValues', validationCode)
      fn(rule, value, callback, allData, SectionWithValues)
    } catch (e) {
      console.error('Validation function error:', e)
      callback(new Error('Validation error'))
    }
  }
}

/**
 * Generate normalize_options from field options
 * Creates a default mapping where each option value maps to itself (case-insensitive)
 * @param options - SelectOption array
 * @returns NormalizeOptions object
 *
 * Example:
 *   generateNormalizeOptionsFromOptions([{"Y": "Yes"}, {"N": "No"}])
 *   → { "Y": ["Y", "Yes"], "N": ["N", "No"] }
 */
export function generateNormalizeOptionsFromOptions(
  options?: { [value: string]: string }[]
): NormalizeOptions | undefined {
  if (!options || options.length === 0) return undefined

  const result: NormalizeOptions = {}

  for (const opt of options) {
    const entries = Object.entries(opt)
    if (entries.length === 0) continue

    const [value, label] = entries[0]
    // Map to itself and its label (case variations)
    result[value] = [
      value,
      value.toLowerCase(),
      value.toUpperCase(),
      label,
      label.toLowerCase(),
      label.toUpperCase()
    ]
  }

  return result
}
