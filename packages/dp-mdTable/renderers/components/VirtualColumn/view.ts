import type { ViewRenderFunctionParams, VirtualColumnOptions, ColumnFieldType } from "../../../types/column-types";
import { h } from 'vue'
import {
  renderAsSingleSelect,
  renderAsMultiSelect,
  renderAsNumber,
  renderAsDateTime,
  renderAsEmail,
  renderAsURL,
  renderAsPhone,
  renderAsCheckbox,
  renderAsRating,
  renderAsText
} from './renderHelpers'

// Column type constants (matching ColumnFieldType enum)
const COLUMN_TYPES = {
  MultiText: 1,
  Number: 2,
  SingleSelect: 3,
  MultiSelect: 4,
  DateTime: 5,
  URL: 8,
  Email: 9,
  Phone: 10,
  Checkbox: 11,
  Rating: 12,
  Text: 19
}

export const VirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props = options?.props as VirtualColumnOptions | undefined
  // Get the display field name from properties or parse from column field
  const sourceRelationField = props?.sourceRelationField || column.field.split('.')[0]
  const displayFieldName = props?.displayFieldName || column.field.split('.')[1]
  
  // The data is stored as relationField.displayField in the row
  const dataKey = `${sourceRelationField}.${displayFieldName}`
  const rawValues = row[dataKey]
  
  // Handle empty values
  if (!rawValues || (Array.isArray(rawValues) && rawValues.length === 0)) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }
  
  // Convert to array for consistent handling
  let displayValues = Array.isArray(rawValues) ? [...rawValues] : [rawValues]
  
  // Apply aggregation if specified
  const aggregation = props?.aggregation || 'all'
  switch (aggregation) {
    case 'first':
      displayValues = displayValues.slice(0, 1)
      break
    case 'last':
      displayValues = displayValues.slice(-1)
      break
    case 'count':
      return h('div', { class: 'virtual-column-view count' }, String(displayValues.length))
    // 'all' shows all values
  }
  
  // Apply unique filter if specified
  if (props?.showUniqueOnly) {
    displayValues = [...new Set(displayValues)]
  }
  
  const separator = props?.separator || ', '
  const targetConfig = props?.targetFieldConfig
  
  // Render based on target field type (if available)
  if (targetConfig?.type) {
    switch (targetConfig.type) {
      case COLUMN_TYPES.SingleSelect:
        return renderAsSingleSelect(displayValues, targetConfig, separator)
      
      case COLUMN_TYPES.MultiSelect:
        return renderAsMultiSelect(displayValues, targetConfig, separator)
      
      case COLUMN_TYPES.Number:
        return renderAsNumber(displayValues, targetConfig, separator)
      
      case COLUMN_TYPES.DateTime:
        return renderAsDateTime(displayValues, targetConfig, separator)
      
      case COLUMN_TYPES.Email:
        return renderAsEmail(displayValues, separator)
      
      case COLUMN_TYPES.URL:
        return renderAsURL(displayValues, separator)
      
      case COLUMN_TYPES.Phone:
        return renderAsPhone(displayValues, separator)
      
      case COLUMN_TYPES.Checkbox:
        return renderAsCheckbox(displayValues, separator)
      
      case COLUMN_TYPES.Rating:
        return renderAsRating(displayValues, targetConfig, separator)
      
      case COLUMN_TYPES.Text:
      case COLUMN_TYPES.MultiText:
      default:
        // Fall through to text rendering
        break
    }
  }
  
  // Default: render as plain text
  return renderAsText(displayValues, separator)
}

export const VirtualColumnEdit = ({ options, params }: ViewRenderFunctionParams<string>) => {
  // Virtual columns are read-only - they display data from relations
  // Editing should happen on the parent relation column
  return VirtualColumnView({ options, params })
}
