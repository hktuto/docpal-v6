import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElInput } from "element-plus";
export const TextView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const textOptions = options?.props
  // console.log('textOptions', textOptions)
  return h('div', {
    class: 'text-view mb-table-cell',
    title: row[column.field],
    "data-title": row[column.field],
  }, row[column.field])
}

export const TextEdit = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const textOptions = options?.props

  return h(ElInput, {
    modelValue: row[column.field],
    'onUpdate:modelValue': (value: string) => { row[column.field] = value },
    class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius',
  })
}
