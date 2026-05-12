import type { ViewRenderFunctionParams } from "../../../types/column-types";

export const renderSelectView = ({ options, params }: ViewRenderFunctionParams<string>): VNode => {
  const { $grid, row, column } = params
  const { options: selectOptions } = options?.props

  if(!selectOptions || !row[column.field]) {
    return !!row[column.field] ? h('span', 'error, on options in column config') : ''
  }
  const selectedOption = selectOptions.find((option: any) => option.id === row[column.field])
  return h('div', {
    class: 'table-tag',
    style: `--color: ${selectedOption?.color}`,
    onMouseenter: (e) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column },e)
    },
    onMouseleave: (e) => {
       $grid.dispatchEvent('cell-mouseleave', { row, column },e)
    },
  }, selectedOption?.label )
}

export const renderMultipleSelectView = ({ options, params }: ViewRenderFunctionParams<string>): VNode => {
  const { $grid, row, column } = params
  const { options: selectOptions } = options?.props

  if(!selectOptions || !row[column.field] || !Array.isArray(row[column.field])) {
    return !!row[column.field] ? h('span', 'error, on options in column config') : ''
  }
  const selectedOptions = row[column.field].map((id: string) => selectOptions.find((option: any) => option.id === id))
  return h('div', {
    class: 'table-tag-list',
    onMouseenter: (e) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column },e)
    },
    onMouseleave: (e) => {
       $grid.dispatchEvent('cell-mouseleave', { row, column },e)
    },
  }, selectedOptions.map((option: any) => h('div', {
    class: 'table-tag',
    style: `--color: ${option?.color}`
  }, option?.label )) )
}
