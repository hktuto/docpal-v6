import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElTag } from "element-plus";

export const RelationView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table,$grid, row, column } = params
  const relationOptions = options?.props
  // console.log("table", params)
  // Parse the column field to get relation field and display field
  // Format: relationFieldName.displayFieldName
  let relationFieldName = column.field
  let displayValue: any = column.field.includes('.') ? row[column.field] : row[column.field + '.' + relationOptions.displayField]
  // console.log('displayData', displayData)
  
  // The UUID value(s) are stored in the base relation field
  // All relations are now arrays (uuid[])
  const value = displayValue
  
  if (!value || !Array.isArray(value) || value.length === 0) {
    return h('div', { class: 'relation-view empty' }, '-')
  }
  
  // Display as tags for arrays
  const displayValues = Array.isArray(displayValue) ? displayValue : []
  
  // Get the base relation field name (without display field suffix)
  const baseRelationFieldName = column.field.includes('.') 
    ? column.field.split('.')[0] 
    : column.field
  
  // Get the UUID values from the base relation field
  const relationUuids = row[baseRelationFieldName] || []
  
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
      type: 'info',
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        $grid.dispatchEvent('relation-cell-click', {
          event: e,
          targetElement: e.currentTarget,
          targetTableId: relationOptions?.relationTableId,
          recordId: Array.isArray(relationUuids) ? relationUuids[index] : relationUuids,
          displayValue: val,
          row
        })
      }
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
