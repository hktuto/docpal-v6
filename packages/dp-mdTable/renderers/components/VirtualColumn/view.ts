import type { ViewRenderFunctionParams, VirtualColumnOptions } from "../../../types/column-types";
import { ElTag } from "element-plus";

export const VirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props = options?.props as VirtualColumnOptions | undefined
  
  // Get the display field name from properties or parse from column field
  const sourceRelationField = props?.sourceRelationField || column.field.split('.')[0]
  const displayFieldName = props?.displayFieldName || column.field.split('.')[1]
  
  // The data is stored as relationField.displayField in the row
  const dataKey = `${sourceRelationField}.${displayFieldName}`
  const values = row[dataKey]
  
  // Handle empty values
  if (!values || (Array.isArray(values) && values.length === 0)) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }
  
  // Convert to array for consistent handling
  let displayValues = Array.isArray(values) ? values : [values]
  
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
  
  // Render based on display mode
  const displayMode = props?.displayMode || 'text'
  
  switch (displayMode) {
    case 'chips':
      return h('div', { 
        class: 'virtual-column-view chips',
        style: {
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap'
        }
      }, displayValues.map((val: any, index: number) => 
        h(ElTag, {
          key: index,
          size: 'small',
          type: 'info'
        }, () => String(val ?? ''))
      ))
    
    case 'list':
      return h('div', { 
        class: 'virtual-column-view list',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }
      }, displayValues.map((val: any, index: number) => 
        h('div', { key: index, class: 'list-item' }, String(val ?? ''))
      ))
    
    case 'link':
      // TODO: Implement click-to-navigate behavior
      return h('div', { 
        class: 'virtual-column-view link',
        style: {
          color: 'var(--el-color-primary)',
          cursor: 'pointer'
        }
      }, displayValues.join(props?.separator || ', '))
    
    case 'text':
    default:
      const separator = props?.separator || ', '
      return h('div', { 
        class: 'virtual-column-view text'
      }, displayValues.join(separator))
  }
}

export const VirtualColumnEdit = ({ options, params }: ViewRenderFunctionParams<string>) => {
  // Virtual columns are read-only - they display data from relations
  // Editing should happen on the parent relation column
  return VirtualColumnView({ options, params })
}
