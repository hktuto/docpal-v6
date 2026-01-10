import type { ViewRenderFunctionParams } from "../../../types/column-types";

export const DateTimeView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const dateTimeOptions = options?.props
  // console.log('dateTimeOptions', dateTimeOptions)
  // check if value is a date object
  if(row[column.field] instanceof Date) {
    return h('div', {
      class: 'date-time-view',
    }, row[column.field].toLocaleString())
  }
  // check if value is a timestamp
  if(typeof row[column.field] === 'number') {
    return h('div', {
      class: 'date-time-view',
    }, new Date(row[column.field]).toLocaleString())
  }
  // default
  return h('div', {
    class: 'date-time-view',
  }, row[column.field])
    
  
}
