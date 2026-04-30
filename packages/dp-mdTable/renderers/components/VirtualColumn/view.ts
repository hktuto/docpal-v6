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
  const relationFieldConfig = viewTools?.getRelationFieldConfig(props.relation_table_id, props.display_field_id)
  const relationArray = buildRelationArray(row, props.relation_field_name, relationFieldConfig.field_name)
  // console.log('relationFieldConfig', relationFieldConfig, ColumnFieldType.MultiSelect, ColumnFieldType.MultiSelect === relationFieldConfig.business_type)
  const values = relationArray.map((item: any) => item[relationFieldConfig.field_name])
  switch (relationFieldConfig.business_type) {
    case ColumnFieldType.SingleSelect:
      return renderAsSingleSelect(values, relationFieldConfig)
    case ColumnFieldType.MultiSelect:
      return renderAsMultiSelect(values, relationFieldConfig)
    default:
  }

  const tags: ReturnType<typeof h>[] = []
  for (let i = 0; i < relationArray.length; i++) {
    tags.push(
      h(
        ElTag,
        {
          key: `${relationFieldConfig.field_name}-${i}`,
          size: 'small',
          type: 'info'
        },
        () => String(relationArray[i][relationFieldConfig.field_name] || '-')
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
