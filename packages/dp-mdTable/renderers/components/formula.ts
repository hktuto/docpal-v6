import type { ViewRenderFunctionParams } from '../../types/column-types'
import { h } from 'vue'
import { evalFormula } from '../../components/tools/formulaEditor/formulaHelper'
export const FormulaView = ({options, params}: ViewRenderFunctionParams<string>) => {
  const { $table, row, column } = params
  const { formula } = options?.props
  const result = evalFormula(formula, row)
  console.log('result', result)
  return h('div', {title: 'The data in the current cell comes from a formula and cannot be edited.'}, result)
}
