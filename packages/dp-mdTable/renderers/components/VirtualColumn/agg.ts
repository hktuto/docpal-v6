import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
import { h } from 'vue'
import { renderAsNumber } from './renderHelpers'
export const AggVirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props: any = options?.props || {}
  return renderAsNumber([row[column.field]], props)
}
