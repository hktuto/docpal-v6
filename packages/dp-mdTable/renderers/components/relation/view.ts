import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElTag } from "element-plus";

export const RelationView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table,$grid, row, column } = params
  const relationOptions = options?.props
  const displayFieldName = relationOptions.display_field_names[0]
  let fieldName = column.field
  let displayFieldNames = fieldName + '.' + displayFieldName
  let displayValues = row[displayFieldNames].split(',').filter((val: any) => val !== '') || []
  
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
      key: displayValues[index] || index,
      size: 'small',
      type: 'info',
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        $grid.dispatchEvent('relation-cell-click', {
          event: e,
          targetElement: e.currentTarget,
          targetTableId: relationOptions?.relationTableId,
          recordId: displayValues[index],
          displayValue: val,
          row
        })
      }
    }, () => val || displayValues[index])
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
    class: 'relation-editaaa',
    style: {
      padding: '4px 8px',
      background: 'var(--el-fill-color-light)',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  }, displayValue || 'Select...')
}
