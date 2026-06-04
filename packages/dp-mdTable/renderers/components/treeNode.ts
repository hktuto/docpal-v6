import { formatCount } from '../../composables/useCount'
import type { CountMethod } from '../../types/count-type'
import type { ViewRenderFunctionParams } from '../../types/column-types'
import { formatTableFieldDisplayValue } from '../../utils/fieldValueFormat'
import { useI18n } from 'vue-i18n'

export const TreeNode = ({ options, params }: ViewRenderFunctionParams<string>, feedback: (params: ViewRenderFunctionParams<string>) => any) => {
  const { t } = useI18n()
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
        const rawValue = row[groupColumnField.field_name]
        const value = formatTableFieldDisplayValue(rawValue, groupColumnField, row, fullColumn.display_structure) || ''
        const hList: any[] = [
          h('div', { class: 'tree-node-header' }, [h('span', { class: 'tree-node-title' }, title), h('span', { class: 'tree-node-value' }, value)])
        ]
        const count = formatCount(countValue, fullColumn.countMethod, fullColumn.display_structure)
        if (count && count !== '-') {
          hList.push(h('span', { class: 'tree-node-count' }, count))
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
      const method = fullColumn.countMethod as CountMethod
      const methodLabel = t(`mdTable.countMethod.${method}`)
      const countText = formatCount(countValue, method, fullColumn.display_structure)
      return h(
        'div',
        {
          class: 'tree-node-agg-cell',
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          }
        },
        [h('span', { class: 'tree-node-agg-method' }, methodLabel), h('span', { class: 'tree-node-agg-value' }, countText)]
      )
    }
  }
  return feedback({ options, params })
}
