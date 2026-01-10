import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElInput } from "element-plus";
export const MultiTextView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const multiTextOptions = options?.props
  // console.log('multiTextOptions', multiTextOptions)
  return h('div', {
    class: 'multi-text-view',
  }, row[column.field])
}

export const MultiTextEdit = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const multiTextOptions = options?.props
  // console.log('multiTextOptions', multiTextOptions)
  return h(ElInput, {
    type: 'textarea',
    modelValue: row[column.field],
    'onUpdate:modelValue': (value: string) => { row[column.field] = value },
  })
}
