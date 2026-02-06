import type { ViewRenderFunctionParams, EditRenderFunctionParams } from "../../../types/column-types";
import { clientApi } from "api";
export const UserView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const userOptions = options?.props
  // console.log('userOptions', userOptions)
  return h('div', {
    class: 'user-view',
  }, row[column.field])
}

