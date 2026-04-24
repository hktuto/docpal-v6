import type { ViewRenderFunctionParams } from '../../types/column-types'
export const TreeNode = ({ options, params }: ViewRenderFunctionParams<string>, feedback: (params: ViewRenderFunctionParams<string>) => any) => {
  const { $table, row, column } = params
  if (row.isAggregate) {
    const value = row[column.field] || ''
    if (column.treeNode) {
      const hList: any[] = []
      if (value && value !== 0) {
        hList.push(
          h('div', { class: 'tree-node-header' }, [
            h('span', { class: 'tree-node-title' }, row.title),
            h('span', { class: 'tree-node-value' }, value),
          ]),
          h('span', { class: 'tree-node-count' }, row.__count)
        )
      }
      return h('div', { class: 'custom-tree-node' }, hList)
    } else {
      return h('div', {}, value)
    }
  }
  return feedback({ options, params })
}
