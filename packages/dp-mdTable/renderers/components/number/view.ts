import { h, type Component } from 'vue'
import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElInputNumber } from 'element-plus'

export const NumberView = ({ options, params }: ViewRenderFunctionParams<number>) => {
  const { $grid, row, column } = params
  const numberOptions = options?.props
  const value = row[column.field]
  if (isNaN(value)) {
    return !!value ? h('span', 'no a valid number') : ''
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
      'data-title': formattedValue,
      onMouseenter: (e) => {
        $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
      },
      onMouseleave: (e) => {
        $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
      }
    },
    formattedValue
  )
}

export const NumberEdit = ({ options, params }: ViewRenderFunctionParams<number>) => {
  const { row, column } = params
  const numberOptions = options?.props ?? {}
  const precision = typeof numberOptions.precision === 'number' ? numberOptions.precision : 0
  const currentValue = row[column.field]
  const inputRef = ref<any>(null)

  return h(ElInputNumber as Component, {
    ref: inputRef,
    modelValue: currentValue != null && currentValue !== '' ? Number(currentValue) : null,
    'onUpdate:modelValue': (value: number | undefined | null) => {
      row[column.field] = value ?? null
    },
    precision,
    controls: false,
    align: 'left',
    class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius mdTable-number-edit',
    onVnodeMounted: () => {
      nextTick(() => {
        inputRef.value?.focus?.()
      })
    }
  })
}
