import type { ViewRenderFunctionParams, EditRenderFunctionParams } from "../../../types/column-types";
import { clientApi } from "api";
export const UserView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const userOptions = options?.props
  // console.log('userOptions', userOptions)
  return h('div', {
    class: 'user-view',
    onMouseenter: (e) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column },e)
    },
    onMouseleave: (e) => {
       $grid.dispatchEvent('cell-mouseleave', { row, column },e)
    },
  }, row[column.field])
}
