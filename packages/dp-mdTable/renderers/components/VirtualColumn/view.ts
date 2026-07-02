import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
import { buildRelationArray, getRelationTagClickProps, type RelationClickContext } from '../../../utils/relationHelper'
import { h } from 'vue'
import { ElTag } from 'element-plus'
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
  const {$grid, row, column } = params
  const props: any = options?.props || {}
  const viewTools: any = inject('viewTools')
  const fieldName = props.display_field_name
  const relationArray = buildRelationArray(row, props.relation_field_name, fieldName)
  const values = relationArray.map((item: any) => item[fieldName])
  const relationClickContext: RelationClickContext = {
    relationTableId: props.relation_table_id,
    relationFieldName: props.relation_field_name,
    relationArray,
    displayFieldName: fieldName
  }
  switch (props.display_field_type) {
    case ColumnFieldType.DateTime:
      return renderAsDateTime(values, params, props, ', ', relationClickContext)
    case ColumnFieldType.Number:
      return renderAsNumber(values, params, props, ', ', relationClickContext)
    case ColumnFieldType.SingleSelect:
      return renderAsSingleSelect(values, params, props, ', ', relationClickContext)
    case ColumnFieldType.MultiSelect:
      return renderAsMultiSelect(values, params, props, ', ', relationClickContext)
    default:
  }

  const tags: ReturnType<typeof h>[] = []
  for (let i = 0; i < relationArray.length; i++) {
    tags.push(
      h(
        ElTag,
        {
          key: `${fieldName}-${i}`,
          size: 'small',
          type: 'info',
          ...getRelationTagClickProps($grid, params, relationClickContext, i)
        },
        () => String(relationArray[i][fieldName] || '-')
      )
    )
  }

  return h(
    'div',
    {
      class: 'virtual-column-view',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      },
      onMouseenter: (e) => {
        $grid.dispatchEvent('cell-mouseenter', { row, column },e)
      },
      onMouseleave: (e) => {
         $grid.dispatchEvent('cell-mouseleave', { row, column },e)
      },
    },
    tags
  )
}
