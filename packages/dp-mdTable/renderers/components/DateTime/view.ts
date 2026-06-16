import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { ElDatePicker } from 'element-plus'
import { formatDateTime, getRowCellValue } from '../../../utils/fieldValueFormat'
export const DateTimeView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const { dateFormat, includeTime, dateTimeFormat, timezone, includeTimeZone } = options?.props
  const value = getRowCellValue(row, column)
  if(!value) return h('div', {
    class: 'date-time-view mb-table-cell',
    'title': ''
  }, '')

  const displayValue = formatDateTime(value, {
    dateFormat,
    includeTime,
    dateTimeFormat,
    timezone,
    includeTimeZone
  })
  return h(
    'div',
    {
      class: 'date-time-view mb-table-cell',
      'title': displayValue,
      onMouseenter: (e) => {
        $grid.dispatchEvent('cell-mouseenter', { row, column },e)
      },
      onMouseleave: (e) => {
         $grid.dispatchEvent('cell-mouseleave', { row, column },e)
      },
    },
    displayValue
  )

}
export const DateTimeEdit = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const { dateFormat, includeTime, dateTimeFormat } = options?.props

  const inputRef = ref<any>(null)
  const format = includeTime ? dateFormat + ' ' + dateTimeFormat : dateFormat
  return h(ElDatePicker, {
    type: includeTime ? 'datetime' : 'date',
    modelValue: row[column.field],
    valueFormat: 'x',
    class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius',
    format: format || 'YYYY-MM-DD',
    'onUpdate:modelValue': (value: string) => {
      row[column.field] = value
    },
    ref: inputRef,
    onVnodeMounted: () => {
      nextTick(() => {
        inputRef.value.focus()
      })
    }
  })
}
