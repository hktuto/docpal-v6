/**
 * 公式校验工具
 */

import { scanVariableMatches } from './formulaTransform'

/**
 * 变量接口
 */
export interface Variable {
  label: string
  value: string
}

/**
 * 校验结果
 */
export interface ValidateResult {
  valid: boolean
  message?: string
}

/**
 * 运算符正则表达式：匹配所有支持的运算符
 */
const OPERATOR_PATTERN = /(>=|<=|==|!=|&&|\|\||[+\-*/><=,])/

/**
 * 函数名正则表达式：匹配函数名（字母/下划线开头，后跟字母/数字/下划线）
 */
const FUNCTION_NAME_PATTERN = /[A-Za-z_][A-Za-z0-9_]*\(/g

/**
 * 找到函数调用的结束位置（匹配括号）
 * @param str - 要搜索的字符串
 * @param startPos - 开始位置（左括号的位置）
 * @returns 函数调用的结束位置（右括号的位置），如果未找到返回 -1
 */
function findFunctionEnd(str: string, startPos: number): number {
  if (startPos < 0 || startPos >= str.length || str[startPos] !== '(') {
    return -1
  }

  let depth = 1
  let pos = startPos + 1

  while (pos < str.length && depth > 0) {
    if (str[pos] === '(') {
      depth++
    } else if (str[pos] === ')') {
      depth--
    } else if (str[pos] === "'" || str[pos] === '"') {
      // 跳过字符串字面量
      const quote = str[pos]
      pos++
      while (pos < str.length && str[pos] !== quote) {
        if (str[pos] === '\\') {
          pos++ // 跳过转义字符
        }
        pos++
      }
    }
    if (depth > 0) {
      pos++
    }
  }

  return depth === 0 ? pos : -1
}

/**
 * 检查字符串是否包含运算符
 * @param str - 要检查的字符串
 * @returns 是否包含运算符
 */
function hasOperator(str: string): boolean {
  return OPERATOR_PATTERN.test(str)
}

function getFormulaEditorMessage(key: string, fallback: string): string {
  try {
    const i18n = useNuxtApp().$i18n as any
    return i18n.t(`mdTable.formulaEditor.${key}`, fallback)
  } catch {
    return fallback
  }
}

/**
 * 校验圆括号是否成对（跳过字符串与变量名）
 */
function validateParentheses(formulaNoSpace: string, variables?: Variable[]): string | null {
  const variableRanges = variables ? scanVariableMatches(formulaNoSpace, variables, 'value') : []

  function isInsideVariable(index: number) {
    return variableRanges.some((range) => index >= range.start && index < range.end)
  }

  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < formulaNoSpace.length; i++) {
    if (isInsideVariable(i)) {
      continue
    }

    const char = formulaNoSpace[i]

    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      continue
    }

    if (inString) {
      if (char === '\\') {
        i++
        continue
      }
      if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      continue
    }

    if (char === '(') {
      depth++
      continue
    }

    if (char === ')') {
      depth--
      if (depth < 0) {
        return getFormulaEditorMessage('unexpectedClosingParen', '括号不匹配：多余的右括号')
      }
    }
  }

  if (depth > 0) {
    return getFormulaEditorMessage('missingClosingParen', '括号不匹配：缺少右括号')
  }

  return null
}

/**
 * 元素接口：表示公式中的变量或函数
 */
interface Element {
  type: 'variable' | 'function'
  startNoSpace: number // 在去除空格后的开始位置
  endNoSpace: number // 在去除空格后的结束位置
  variableValue?: string // 变量的值（仅当 type 为 'variable' 时）
}

/**
 * 检查变量是否合法
 * @param variableValue - 变量值
 * @param validVariableValues - 合法变量值集合
 * @returns 如果不合法返回错误消息，否则返回 null
 */
function validateVariable(variableValue: string, validVariableValues: Set<string>): string | null {
  if (validVariableValues.size > 0 && !validVariableValues.has(variableValue)) {
    try {
      const i18n = useNuxtApp().$i18n as any
      const translated = i18n.t('mdTable.formulaEditor.unrecognizedVariable', variableValue)
      return translated.includes('{0}') ? translated.replace('{0}', variableValue) : translated
    } catch (e) {
      return `未识别变量 ${variableValue}`
    }
  }
  return null
}

/**
 * 查找所有变量元素
 * @param formulaNoSpace - 去除空格后的公式
 * @returns 变量元素数组
 */
function findVariables(formulaNoSpace: string, variables: Variable[]): Element[] {
  return scanVariableMatches(formulaNoSpace, variables, 'value').map((match) => ({
    type: 'variable' as const,
    startNoSpace: match.start,
    endNoSpace: match.end - 1,
    variableValue: match.variable.value
  }))
}

/**
 * 查找所有函数元素
 * @param formulaNoSpace - 去除空格后的公式
 * @returns 函数元素数组
 */
function findFunctions(formulaNoSpace: string): Element[] {
  const elements: Element[] = []
  const matches = formulaNoSpace.matchAll(FUNCTION_NAME_PATTERN)

  for (const match of matches) {
    const funcNameStartNoSpace = match.index!
    const leftParenNoSpace = funcNameStartNoSpace + match[0].length - 1

    // 查找函数结束位置（匹配右括号）
    const funcEndNoSpace = findFunctionEnd(formulaNoSpace, leftParenNoSpace)

    if (funcEndNoSpace < 0) {
      continue
    }

    elements.push({
      type: 'function',
      startNoSpace: funcNameStartNoSpace,
      endNoSpace: funcEndNoSpace
    })
  }

  return elements
}

/**
 * 检查两个元素之间是否有运算符
 * @param current - 当前元素
 * @param next - 下一个元素
 * @param formulaNoSpace - 去除空格后的公式
 * @returns 如果校验失败返回错误消息，否则返回 null
 */
function validateBetweenElements(current: Element, next: Element, formulaNoSpace: string): string | null {
  // 检查下一个元素是否在当前函数内部
  if (current.type === 'function' && next.startNoSpace < current.endNoSpace) {
    // 函数参数内部的变量/函数之间用逗号分隔是正常的，跳过检查
    return null
  }

  // 检查两个元素之间的内容
  const betweenNoSpace = formulaNoSpace.substring(current.endNoSpace + 1, next.startNoSpace)

  // 如果直接相邻或之间没有运算符，则校验失败
  if (betweenNoSpace.length === 0 || !hasOperator(betweenNoSpace)) {
    try {
      const i18n = useNuxtApp().$i18n as any
      return i18n.t('mdTable.formulaEditor.missingOperator')
    } catch (e) {
      console.error(e)
      // 如果 i18n 不可用，使用默认中文消息
      return '变量或函数之间缺少运算符'
    }
  }

  return null
}

/**
 * 校验公式：检查变量和函数之间是否有运算符
 * @param formula - 要校验的公式
 * @param variables - 合法变量列表（可选）
 * @returns 校验结果
 */
export function validateFormula(formula: string, variables?: Variable[]): ValidateResult {
  // 空公式校验通过
  if (!formula || formula.trim().length === 0) {
    return { valid: true }
  }

  // 去除空格用于分析
  const formulaNoSpace = formula.replace(/\s/g, '')

  if (formulaNoSpace.length === 0) {
    return { valid: true }
  }

  const parenthesesError = validateParentheses(formulaNoSpace, variables)
  if (parenthesesError) {
    return { valid: false, message: parenthesesError }
  }

  // 构建合法变量值的集合
  const validVariableValues = new Set<string>()
  if (variables) {
    for (const variable of variables) {
      validVariableValues.add(variable.value)
    }
  }

  // 查找所有变量和函数
  const variableElements = variables?.length ? findVariables(formulaNoSpace, variables) : []
  const functionElements = findFunctions(formulaNoSpace)

  // 合并并排序所有元素
  const elements: Element[] = [...variableElements, ...functionElements]
  elements.sort((a, b) => a.startNoSpace - b.startNoSpace)

  // 如果没有找到任何元素，直接返回成功
  if (elements.length === 0) {
    return { valid: true }
  }

  // 校验所有变量是否合法（优先检查，提供更具体的错误信息）
  for (const element of elements) {
    if (element.type === 'variable' && element.variableValue) {
      const error = validateVariable(element.variableValue, validVariableValues)
      if (error) {
        return { valid: false, message: error }
      }
    }
  }

  // 检查相邻元素之间是否有运算符
  for (let i = 0; i < elements.length - 1; i++) {
    const current = elements[i]
    const next = elements[i + 1]

    const error = validateBetweenElements(current, next, formulaNoSpace)

    if (error) {
      return { valid: false, message: error }
    }
  }

  // 额外检查：对于每个函数，检查是否有其他函数或变量紧跟在它后面（在同一层级）
  // 这用于处理嵌套函数的情况，例如 IF(...)CONCAT() 中，IF 和 CONCAT 之间需要运算符
  // 注意：这个检查只处理在第一次循环中因为元素在函数内部而被跳过的情况
  for (let i = 0; i < elements.length; i++) {
    const current = elements[i]
    if (current.type !== 'function') {
      continue
    }

    // 查找在当前函数外部且紧跟在它后面的第一个元素
    let nextExternalElement: Element | null = null
    for (let j = 0; j < elements.length; j++) {
      if (i === j) {
        continue
      }
      const other = elements[j]
      // 如果 other 在 current 外部
      if (other.startNoSpace > current.endNoSpace) {
        // 找到第一个这样的元素（startNoSpace 最小）
        if (!nextExternalElement || other.startNoSpace < nextExternalElement.startNoSpace) {
          nextExternalElement = other
        }
      }
    }

    // 如果找到了紧跟在后面的外部元素，检查它们之间是否有运算符
    // 但要避免重复检查：如果 nextExternalElement 在排序后紧跟在 current 后面（nextIndex === currentIndex + 1），
    // 且它们之间没有元素在 current 内部，那么已经在第一次循环中检查过了
    if (nextExternalElement) {
      const currentIndex = i
      const nextIndex = elements.indexOf(nextExternalElement)
      
      // 检查是否在第一次循环中已经检查过
      // 如果 nextExternalElement 在排序后紧跟在 current 后面（nextIndex === currentIndex + 1），
      // 那么已经在第一次循环中检查过了
      const alreadyChecked = nextIndex === currentIndex + 1

      // 如果没有检查过，则检查它们之间是否有运算符
      if (!alreadyChecked) {
        const betweenNoSpace = formulaNoSpace.substring(current.endNoSpace + 1, nextExternalElement.startNoSpace)
        if (betweenNoSpace.length === 0 || !hasOperator(betweenNoSpace)) {
          try {
            const i18n = useNuxtApp().$i18n as any
            return { valid: false, message: i18n.t('mdTable.formulaEditor.missingOperator') }
          } catch (e) {
            return { valid: false, message: '变量或函数之间缺少运算符' }
          }
        }
      }
    }
  }

  return { valid: true }
}
