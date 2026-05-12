import type { ViewRenderFunctionParams } from '../../types/column-types'
import { h } from 'vue'
import { evalFormula } from '../../components/tools/formulaEditor/formulaHelper'
export const FormulaView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const { formula } = options?.props
  const result = evalFormula(formula, row)
  console.log('result', result)
  return h('div', {
    title: 'The data in the current cell comes from a formula and cannot be edited.',
    onMouseenter: (e) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column },e)
    },
    onMouseleave: (e) => {
       $grid.dispatchEvent('cell-mouseleave', { row, column },e)
    },
  }, result)
}
