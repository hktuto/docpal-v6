import { h } from 'vue'
import type { VNode } from 'vue'
import type { ViewRenderFunctionParams } from '../../types/column-types'
import { Icon } from '#components'
/**
 * Document 列视图渲染：根据行数据显示附件
 */
export const DocumentView = ({ options, params }: ViewRenderFunctionParams<boolean>): VNode => {
  const { $grid, row, column } = params
  const properties = options?.props || {}
  if (!column.field || !row[column.field]) {
    return h('div', '')
  }
  const handleClick = () => {
    console.log('row', row)
  }
  // 遍历文件名，div包住后，点击div弹出图片大图
  const fileNames = row[column.field].split(',')
  const fileNodes = fileNames.map((fileName: string) => {
    return h('div', {
      onClick: () => handleClick(),
      onMouseenter: (e) => {
        $grid.dispatchEvent('cell-mouseenter', { row, column },e)
      },
      onMouseleave: (e) => {
         $grid.dispatchEvent('cell-mouseleave', { row, column },e)
      },
    }, fileName)
  })
  return h('div', fileNodes)
}
