import type { ViewRenderFunctionParams } from "../../../types/column-types";

export const renderSelectView = ({ options, params }: ViewRenderFunctionParams<string>): VNode => {
  const { $table, row, column } = params
  const { options: selectOptions } = options?.props
  
  if(!selectOptions || !row[column.field]) {
    return !!row[column.field] ? h('span', 'error, on options in column config') : ''
  }
  const selectedOption = selectOptions.find((option: any) => option.id === row[column.field])
  return h('div', {
    class: 'table-tag',
    style: `--color: ${selectedOption?.color}`
  }, selectedOption?.label )
}

export const renderMultipleSelectView = ({ options, params }: ViewRenderFunctionParams<string>): VNode => {
  const { $table, row, column } = params
  const { options: selectOptions } = options?.props
  
  if(!selectOptions || !row[column.field] || !Array.isArray(row[column.field])) {
    return !!row[column.field] ? h('span', 'error, on options in column config') : ''
  }
  const selectedOptions = row[column.field].map((id: string) => selectOptions.find((option: any) => option.id === id))
  return h('div', {
    class: 'table-tag-list',
    onClick:() => {
      const router = useRouter()
      console.log("router", router)
    },
  }, selectedOptions.map((option: any) => h('div', {
    class: 'table-tag',
    style: `--color: ${option?.color}`
  }, option?.label )) )
}
