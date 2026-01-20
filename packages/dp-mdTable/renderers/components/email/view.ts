import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElInput } from "element-plus";

export const EmailView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const emailOptions = options?.props
  // console.log('emailOptions', emailOptions)
  return h('a', {
    class: 'email-view mb-table-cell',
    href: `mailto:${row[column.field]}`,
    "data-title": row[column.field],
  }, row[column.field])
}

export const EmailEdit = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const emailOptions = options?.props
  // console.log('emailOptions', emailOptions)
  const inputRef = ref<any>(null)
  return h(ElInput, {
    type: 'email',
    modelValue: row[column.field],
    class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius',
    'onUpdate:modelValue': (value: string) => { row[column.field] = value },
    ref: inputRef,
    onVnodeMounted: () => {
      nextTick(() => {
        inputRef.value.focus()
      })
    }
  })
}
