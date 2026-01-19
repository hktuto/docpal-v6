import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElTag } from "element-plus";

export const RelationView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const relationOptions = options?.props
  
  // Parse the column field to get relation field and display field
  // Format: relationFieldName.displayFieldName
  let relationFieldName = column.field
  let displayValue: any
  
  if (column.field.includes('.')) {
    // New format: column.field is "relationFieldName.displayFieldName"
    // The display value is stored with the same key
    displayValue = row[column.field]
    // Extract the base relation field name to get the UUID value
    relationFieldName = column.field.split('.')[0]
  } else {
    // Backward compatibility: old format used "_display" suffix
    const displayKey = `${column.field}_display`
    displayValue = row[displayKey]
  }
  
  // The UUID value(s) are stored in the base relation field
  const value = row[relationFieldName]
  const allowMultiple = relationOptions?.allowMultiple || false
  
  if (!value) {
    return h('div', { class: 'relation-view empty' }, '-')
  }
  
  // Handle multiple relations
  if (allowMultiple && Array.isArray(value)) {
    if (value.length === 0) {
      return h('div', { class: 'relation-view empty' }, '-')
    }
    
    // Display as tags
    const displayValues = Array.isArray(displayValue) ? displayValue : []
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
  
  // Handle single relation
  const displayText = displayValue || value
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
      console.log('Navigate to related record:', value)
    }
  }, displayText)
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
