import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
import { h } from 'vue'
import { renderAsNumber } from './renderHelpers'
export const AggVirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props: any = options?.props || {}
  const viewTools: any = inject('viewTools')
  const relationFieldConfig = viewTools?.getRelationFieldConfig(props.relation_table_id, props.display_field_id)
  return renderAsNumber([row[column.field]], relationFieldConfig)
}
