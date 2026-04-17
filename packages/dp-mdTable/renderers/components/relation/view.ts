import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElTag } from 'element-plus'
import { buildRelationArray } from '../../../utils/relationHelper'
export const RelationView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, $grid, row, column } = params
  const relationOptions = options?.props
  const displayFieldName = relationOptions.display_field_names[0]
  let fieldName = column.field
  const relationArray = buildRelationArray(row, fieldName, displayFieldName)
  // Multiple items: display as tags
  return h(
    'div',
    relationArray.map((val: any, index: number) =>
      h(
        ElTag,
        {
          key: 'relation-' + index,
          size: 'small',
          type: 'info',
          class: 'relation-tag el-icon--right',
          onClick: (e: MouseEvent) => {
            e.stopPropagation()
          }
        },
        val.displayFieldName
      )
    )
  )
  // return h(
  //   'div',
  //   {
  //     class: 'relation-view multiple',
  //     style: {
  //       display: 'flex',
  //       gap: '4px',
  //       flexWrap: 'wrap'
  //     }
  //   },
  //   relationArray.map((val: any, index: number) =>
  //     h(
  //       ElTag,
  //       {
  //         key: 'relation-' + index,
  //         size: 'small',
  //         type: 'info',
  //         onClick: (e: MouseEvent) => {
  //           e.stopPropagation()
  //           $grid.dispatchEvent('relation-cell-click', {
  //             event: e,
  //             targetElement: e.currentTarget,
  //             targetTableId: relationOptions?.relationTableId,
  //             recordId: val.displayFieldName || index,
  //             displayValue: val,
  //             row
  //           })
  //         }
  //       },
  //       () => val || val.displayFieldName || index
  //     )
  //   )
  // )
}
