import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElTag } from 'element-plus'
import { buildRelationArray } from '../../../utils/relationHelper'
export const RelationView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, $grid, row, column } = params
  const relationOptions = options?.props
  const viewTools: any = inject('viewTools')
  if (!relationOptions?.display_field_ids || relationOptions.display_field_ids.length === 0) return h('span', '-')
  const displayFieldId = relationOptions.display_field_ids[0]
  const displayField = viewTools?.getRelationFieldConfig(relationOptions.relation_table_id, displayFieldId)
  if (!displayField) return h('span', '-')
  let fieldName = column.field
  const relationArray = buildRelationArray(row, fieldName, displayField.field_name)
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
            $grid.dispatchEvent(
              'relation-cell-click',
              {
                event: e,
                targetElement: e.currentTarget,
                targetTableId: relationOptions.relation_table_id,
                recordId: val.id,
                displayValue: val,
                title: val[displayField.field_name],
                relationField: fieldName,
                row,
                column
              },
              e
            )
          },
          onMouseenter: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          }
        },
        val[displayField.field_name]
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
