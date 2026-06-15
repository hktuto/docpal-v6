import type { ViewRenderFunctionParams, EditRenderFunctionParams } from '../../../types/column-types'
import { clientApi } from 'api'
import { formatFieldValue, getRowCellValue } from '../../../utils/fieldValueFormat'
export const UserView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const userOptions = options?.props
  const value = getRowCellValue(row, column)
  const userName = value ? formatFieldValue(value) : ''
  // console.log('userOptions', userOptions)
  return h(
    'div',
    {
      class: 'user-view',
      onMouseenter: (e) => {
        $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
      },
      onMouseleave: (e) => {
        $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
      }
    },
    userName
  )
}
