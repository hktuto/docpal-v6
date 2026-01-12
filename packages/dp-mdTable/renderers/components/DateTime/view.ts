import type { ViewRenderFunctionParams } from "../../../types/column-types";

export const DateTimeView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const dateTimeOptions = options?.props
  // console.log('dateTimeOptions', dateTimeOptions)
  // check if value is a date object
  if(row[column.field] instanceof Date) {
    const displayValue = row[column.field].toLocaleString()
    return h('div', {
      class: 'date-time-view mb-table-cell',
      "data-title": displayValue,
    }, displayValue)
  }
  // check if value is a timestamp
  if(typeof row[column.field] === 'number') {
    const displayValue = new Date(row[column.field]).toLocaleString()
    return h('div', {
      class: 'date-time-view mb-table-cell',
      "data-title": displayValue,
    }, displayValue)
  }
  // default
  return h('div', {
    class: 'date-time-view mb-table-cell',
    "data-title": row[column.field],
  }, row[column.field])
    
  
}
