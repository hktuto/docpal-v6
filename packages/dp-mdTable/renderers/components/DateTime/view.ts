import type { ViewRenderFunctionParams } from '../../../types/column-types'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ElDatePicker } from 'element-plus'
dayjs.extend(utc)
dayjs.extend(timezone)
export const DateTimeView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const { dateFormat, includeTime, dateTimeFormat, timezone, includeTimeZone } = options?.props
  const value = row[column.field]
  if(!value) return h('div', {
    class: 'date-time-view mb-table-cell',
    'title': ''
  }, '')

  const format = includeTime ? dateFormat + ' ' + dateTimeFormat : dateFormat
  console.log('row[column.field]', row[column.field], format)
  let displayValue = dayjs(row[column.field]).format(format || 'YYYY-MM-DD')
  if (includeTime && timezone) {
    displayValue = dayjs(row[column.field]).tz(timezone).format(format)
  }
  if (includeTimeZone) {
    displayValue += ' (' + timezone + ')'
  }
  return h(
    'div',
    {
      class: 'date-time-view mb-table-cell',
      'title': displayValue
    },
    displayValue
  )

}
export const DateTimeEdit = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const { dateFormat, includeTime, dateTimeFormat } = options?.props
  console.log('options', options)
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
