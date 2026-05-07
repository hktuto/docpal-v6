import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
import { buildRelationArray } from '../../../utils/relationHelper'
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
  const { row, column } = params
  const props: any = options?.props || {}
  const viewTools: any = inject('viewTools')
  const fieldName = props.display_field_name
  const relationArray = buildRelationArray(row, props.relation_field_name, fieldName)
  const values = relationArray.map((item: any) => item[fieldName])
  switch (props.display_field_type) {
    case ColumnFieldType.DateTime:
      return renderAsDateTime(values, props)
    case ColumnFieldType.Number:
      return renderAsNumber(values, props)
    case ColumnFieldType.SingleSelect:
      return renderAsSingleSelect(values, props)
    case ColumnFieldType.MultiSelect:
      return renderAsMultiSelect(values, props)
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
          type: 'info'
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
      }
    },
    tags
  )
}
