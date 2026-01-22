import type { ViewRenderFunctionParams } from '../../types/column-types'
export const TreeNode = ({ options, params }: ViewRenderFunctionParams<string>, feedback: (params: ViewRenderFunctionParams<string>) => any) => {
  const { $table, row, column } = params
  if (row.isAggregate) {
    const value = row[column.field] || ''
    if (column.treeNode) {
      const hList: any[] = [row.title]
      if (value && value !== 0) {
        hList.push(h('div', {}, value))
      }
      return h('div', {}, hList)
    } else {
      return h('div', {}, value)
    }
  }
  return feedback({ options, params })
}
