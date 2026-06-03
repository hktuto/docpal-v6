import { h } from 'vue'
import type { VNode } from 'vue'
import type { ViewRenderFunctionParams } from '../../types/column-types'
import { Icon } from '#components'
/**
 * Checkbox 列视图渲染：根据行数据显示勾选状态，样式与 mdForm/field/Checkbox.vue 一致
 */
export const CheckboxView = ({ options, params }: ViewRenderFunctionParams<boolean>): VNode => {
  const { $grid, row, column } = params
  const properties = options?.props || {}
  const iconName = properties.icon
  const { updateRow } = useMDTableInject()
  const handleClick = () => {
    row[column.field] = !row[column.field]
    updateRow(row.id, { [column.field]: row[column.field] })
  }
  if (iconName) {
    return h(Icon, {
      class: { 'checkbox-view-icon--active': row[column.field], 'cursor-pointer': true },
      name: iconName,
      onClick: () => handleClick()
    })
  }
  return h('span', {
    onMouseenter: (e) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column },e)
    },
    onMouseleave: (e) => {
       $grid.dispatchEvent('cell-mouseleave', { row, column },e)
    },
  },'-')
}
