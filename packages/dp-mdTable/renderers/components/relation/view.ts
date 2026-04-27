import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElTag } from 'element-plus'

export const RelationView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, $grid, row, column } = params
  const relationOptions = options?.props
  const displayFieldName = relationOptions.display_field_names[0]
  let fieldName = column.field
  let displayFieldNameSpl = fieldName + '.' + displayFieldName
  let displayValues = Array.isArray(row[displayFieldNameSpl])
    ? row[displayFieldNameSpl]
    : row[displayFieldNameSpl]?.split(',').filter((val: any) => val !== '') || []

  // Multiple items: display as tags
  return h(
    'div',
    {
      class: 'relation-view multiple',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    displayValues.map((val: any, index: number) =>
      h(
        ElTag,
        {
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
        },
        () => val || displayValues[index]
      )
    )
  )
}
