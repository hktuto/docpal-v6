import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElTag } from "element-plus";

export const RelationView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const relationOptions = options?.props
  
  // Parse the column field to get relation field and display field
  // Format: relationFieldName.displayFieldName
  let relationFieldName = column.field
  let displayValue: any
  console.log('row', row, relationOptions)
  const displayData = row[column.field + '.' + relationOptions.displayField]
  console.log('displayData', displayData)
  
  // The UUID value(s) are stored in the base relation field
  // All relations are now arrays (uuid[])
  const value = displayData
  
  if (!value || !Array.isArray(value) || value.length === 0) {
    return h('div', { class: 'relation-view empty' }, '-')
  }
  
  // Display as tags for arrays
  const displayValues = Array.isArray(displayValue) ? displayValue : []
  
  // If only one item, show as a link instead of tag
  if (value.length === 1) {
    const displayText = displayValues[0] || value[0]
    return h('a', {
      class: 'relation-view single',
      href: '#',
      style: {
        color: 'var(--el-color-primary)',
        textDecoration: 'none',
        cursor: 'pointer'
      },
      onClick: (e: Event) => {
        e.preventDefault()
        // TODO: Implement navigation to related record
        console.log('Navigate to related record:', value[0])
      }
    }, displayText)
  }
  
  // Multiple items: display as tags
  return h('div', { 
    class: 'relation-view multiple',
    style: {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap'
    }
  }, displayValues.map((val: any, index: number) => 
    h(ElTag, {
      key: value[index] || index,
      size: 'small',
      type: 'info'
    }, () => val || value[index])
  ))
}

export const RelationEdit = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const relationOptions = options?.props
  
  // TODO: Implement relation selector component
  // For now, just show the display value
  let displayValue: any
  if (column.field.includes('.')) {
    // New format: display value is stored with the same key as column.field
    displayValue = row[column.field]
  } else {
    // Backward compatibility: old format used "_display" suffix
    const displayKey = `${column.field}_display`
    displayValue = row[displayKey] || row[column.field]
  }
  
  return h('div', {
    class: 'relation-edit',
    style: {
      padding: '4px 8px',
      background: 'var(--el-fill-color-light)',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  }, displayValue || 'Select...')
}
