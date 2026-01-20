import { h, type Component } from 'vue'
import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElInput } from 'element-plus'
export const NumberView = ({ options, params }: ViewRenderFunctionParams<number>) => {
  const { $table, row, column } = params
  const numberOptions = options?.props
  const value = row[column.field]
  if (isNaN(value)) {
    return h('span', 'no a valid number')
  }
  const precision = numberOptions?.precision || 0
  let formattedValue = Number(value).toFixed(precision)

  if (numberOptions?.showThouComma) {
    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  if (numberOptions?.symbol) {
    if (!numberOptions.symbolAlign || numberOptions.symbolAlign === 'left') {
      formattedValue = numberOptions.symbol + formattedValue
    } else {
      formattedValue = formattedValue + numberOptions.symbol
    }
  }
  return h(
    'div',
    {
      class: 'number-view mb-table-cell',
      'data-title': formattedValue
    },
    formattedValue
  )
}
export const NumberEdit = ({ options, params }: ViewRenderFunctionParams<number>) => {
  const { $table, row, column } = params
  const { options: numberOptions } = options?.props
  const currentValue = row[column.field]
  const inputRef = ref<any>(null)
  return h(ElInput as Component, {
    ref: inputRef,
    modelValue: currentValue != null ? String(currentValue) : '',
    'onUpdate:modelValue': (value: string | number | null) => {
      row[column.field] = value !== null && value !== '' ? Number(value) : undefined
    },
    class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius',
    type: 'number',
    onKeydown: (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        // 结束编辑
        $table.clearEdit?.()
      }
    },
    onVnodeMounted: () => {
      nextTick(() => {
        inputRef.value.focus()
      })
    }
  })
}
