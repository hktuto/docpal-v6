import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
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

export const VirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props: any = options?.props || {}
  const virtual_field_name = props?.virtual_field_name
  const rawValues = row[virtual_field_name]
  if (!rawValues || (Array.isArray(rawValues) && rawValues.length === 0)) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  let displayValues = Array.isArray(rawValues) ? [...rawValues] : [rawValues]
  if (props?.showUniqueOnly) {
    displayValues = [...new Set(displayValues)]
  }

  const separator = props?.separator || ', '
  const targetConfig = props?.targetFieldConfig

  // Render based on target field type (if available)
  if (targetConfig?.type) {
    switch (targetConfig.type) {
      case ColumnFieldType.SingleSelect:
        return renderAsSingleSelect(displayValues, targetConfig, separator)

      case ColumnFieldType.MultiSelect:
        return renderAsMultiSelect(displayValues, targetConfig, separator)

      case ColumnFieldType.Number:
        return renderAsNumber(displayValues, targetConfig, separator)

      case ColumnFieldType.DateTime:
        return renderAsDateTime(displayValues, targetConfig, separator)

      case ColumnFieldType.Email:
        return renderAsEmail(displayValues, separator)

      case ColumnFieldType.URL:
        return renderAsURL(displayValues, separator)

      case ColumnFieldType.Phone:
        return renderAsPhone(displayValues, separator)

      case ColumnFieldType.Checkbox:
        return renderAsCheckbox(displayValues, separator)

      case ColumnFieldType.Rating:
        return renderAsRating(displayValues, targetConfig, separator)

      case ColumnFieldType.Text:
      case ColumnFieldType.MultiText:
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
