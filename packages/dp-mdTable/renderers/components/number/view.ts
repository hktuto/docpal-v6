import type { ViewRenderFunctionParams } from "../../../types/column-types";


export const NumberView = ({options, params}: ViewRenderFunctionParams<number>) => {
  const { $table, row, column } = params
  const numberOptions = options?.props
  const value = row[column.field]
  if(isNaN(value)) {
    return h('span', 'no a valid number')
  }
  const precision = numberOptions?.precision || 0
  let formattedValue = Number(value).toFixed(precision)
  
  if(numberOptions?.showThouComma) {
    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  if(numberOptions?.symbol) {
    if(!numberOptions.symbolAlign || numberOptions.symbolAlign === 'left') {
      formattedValue = numberOptions.symbol + formattedValue
    } else {
      formattedValue = formattedValue + numberOptions.symbol
    }
  }
  return h('div', {
    class: 'number-view',
  }, formattedValue)
}
