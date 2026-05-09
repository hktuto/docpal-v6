import type { ViewRenderFunctionParams } from '../../types/column-types'
export const TreeNode = ({ options, params }: ViewRenderFunctionParams<string>, feedback: (params: ViewRenderFunctionParams<string>) => any) => {
  const { $table, row, column, level } = params
  const { columnGroupRules, tableFields }: any = inject('viewTools')
  if (row.hasChild) {
    if (column.treeNode) {
      const groupColumn = columnGroupRules.value[level]
      const groupColumnField = tableFields.value.find((field: any) => field.field_name === groupColumn.field)
      const title = groupColumnField.field_name_alias
      const value = row[groupColumnField.field_name] || ''
      const hList: any[] = []
      if (value && value !== 0) {
        hList.push(
          h('div', { class: 'tree-node-header' }, [h('span', { class: 'tree-node-title' }, title), h('span', { class: 'tree-node-value' }, value)]),
          h('span', { class: 'tree-node-count' }, row.count)
        )
      }
      return h('div', { class: 'custom-tree-node' }, hList)
    } else {
      return h('div', {}, '')
    }
  }
  return feedback({ options, params })
}
