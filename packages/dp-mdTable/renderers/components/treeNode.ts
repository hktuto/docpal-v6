import { formatCount } from '../../composables/useCount'
import type { CountMethod } from '../../types/count-type'
import type { ViewRenderFunctionParams } from '../../types/column-types'
export const TreeNode = ({ options, params }: ViewRenderFunctionParams<string>, feedback: (params: ViewRenderFunctionParams<string>) => any) => {
  const { $grid, row, column, level } = params as any
  const { columnGroupRules, tableFields, columns }: any = inject('viewTools')
  if (row.hasChild) {
    const countValue = row[`agg_${column.field}`]
    const fullColumn = columns.value.find((field: any) => field.field_name === column.field)
    if (column.treeNode) {
      try {
        const groupColumn = columnGroupRules.value[level]
        const groupColumnField = tableFields.value.find((field: any) => field.field_name === groupColumn.field)
        const __count = row.__count || 0
        const title = groupColumnField.field_name_alias + '(' + __count + ')'
        const value = row[groupColumnField.field_name] || ''
        const hList: any[] = []
        if (value && value !== 0) {
          hList.push(
            h('div', { class: 'tree-node-header' }, [h('span', { class: 'tree-node-title' }, title), h('span', { class: 'tree-node-value' }, value)]),
            h('span', { class: 'tree-node-count' }, formatCount(countValue, fullColumn.countMethod, fullColumn.display_structure))
          )
        }
        return h('div', { class: 'custom-tree-node' }, hList)
      } catch (error) {
        console.error('TreeNode error', error)
        return h('div', {}, '')
      }
    } else {
      if (!fullColumn?.countMethod || fullColumn.countMethod === 'none') {
        return h('div', {}, '')
      }
      return h(
        'div',
        {
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          }
        },
        formatCount(countValue, fullColumn.countMethod, fullColumn.display_structure)
      )
    }
  }
  return feedback({ options, params })
}
