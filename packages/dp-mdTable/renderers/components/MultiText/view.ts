import { h } from 'vue';
import type { ViewRenderFunctionParams } from "../../../types/column-types";
import { ElInput } from "element-plus";
export const MultiTextView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const multiTextOptions = options?.props
  // console.log('multiTextOptions', multiTextOptions)
  return h('div', {
    class: 'multi-text-view mb-table-cell',
    "data-title": row[column.field],
    editable: true,
  }, row[column.field])
}

export const MultiTextEdit = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  /**
   * 处理键盘事件
   * Shift+Enter: 换行
   * Enter: 结束编辑
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      // 结束编辑
      $table.clearEdit?.()
    }
  }
  
  return h(ElInput, {
    type: 'textarea',
    modelValue: row[column.field] ?? '',
    'onUpdate:modelValue': (value: string) => { row[column.field] = value },
    class: 'vxe-cell-absolute',
    autosize: {
      minRows: 2,
      maxRows: 10,
    },
    onKeydown: handleKeydown
  } as any)
}
