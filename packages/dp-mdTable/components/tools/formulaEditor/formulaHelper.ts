/**
 * 公式函数定义
 */
import dayjs from 'dayjs'

type TFunction = (key: string) => string

export interface FunctionItem {
  name: string
  description: string
  usage: string
  params?: Array<{
    name: string
    description: string
  }>
  example?: string
  func?: (...args: any[]) => any
}

/**
 * 检查表达式括号与字符串是否闭合（避�?new Function 触发语法错误�?
 * @param expression - 表达式字符串
 * @returns 是否闭合
 */
function isExpressionBalanced(expression: string): boolean {
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]

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
        return false
      }
    }
  }

  return depth === 0 && !inString
}

/**
 * 文本函数列表
 */
export function getTextFunctions(t: TFunction): FunctionItem[] {
  return [
    {
      name: 'CONCAT',
      description: t('mdTable.formulaEditor.fn.CONCAT.description'),
      usage: 'CONCAT(text1, text2, ...)',
      params: [
        { name: 'text1', description: t('mdTable.formulaEditor.fn.CONCAT.param.text1') },
        { name: 'text2', description: t('mdTable.formulaEditor.fn.CONCAT.param.text2') }
      ],
      example: t('mdTable.formulaEditor.fn.CONCAT.example'),
      func: (...args: any[]) => {
        return args.join('')
      }
    },
    {
      name: 'LEFT',
      description: t('mdTable.formulaEditor.fn.LEFT.description'),
      usage: 'LEFT(text, num_chars)',
      params: [
        { name: 'text', description: t('mdTable.formulaEditor.fn.LEFT.param.text') },
        { name: 'num_chars', description: t('mdTable.formulaEditor.fn.LEFT.param.num_chars') }
      ],
      example: t('mdTable.formulaEditor.fn.LEFT.example'),
      func: (...args: any[]) => {
        return args[0].slice(0, args[1])
      }
    },
    {
      name: 'RIGHT',
      description: t('mdTable.formulaEditor.fn.RIGHT.description'),
      usage: 'RIGHT(text, num_chars)',
      params: [
        { name: 'text', description: t('mdTable.formulaEditor.fn.RIGHT.param.text') },
        { name: 'num_chars', description: t('mdTable.formulaEditor.fn.RIGHT.param.num_chars') }
      ],
      example: t('mdTable.formulaEditor.fn.RIGHT.example'),
      func: (...args: any[]) => {
        return args[0].slice(-args[1])
      }
    },
    {
      name: 'LEN',
      description: t('mdTable.formulaEditor.fn.LEN.description'),
      usage: 'LEN(text)',
      params: [{ name: 'text', description: t('mdTable.formulaEditor.fn.LEN.param.text') }],
      example: t('mdTable.formulaEditor.fn.LEN.example'),
      func: (...args: any[]) => {
        return args[0].length
      }
    },
    {
      name: 'UPPER',
      description: t('mdTable.formulaEditor.fn.UPPER.description'),
      usage: 'UPPER(text)',
      params: [{ name: 'text', description: t('mdTable.formulaEditor.fn.UPPER.param.text') }],
      example: t('mdTable.formulaEditor.fn.UPPER.example'),
      func: (...args: any[]) => {
        return args[0].toUpperCase()
      }
    },
    {
      name: 'LOWER',
      description: t('mdTable.formulaEditor.fn.LOWER.description'),
      usage: 'LOWER(text)',
      params: [{ name: 'text', description: t('mdTable.formulaEditor.fn.LOWER.param.text') }],
      example: t('mdTable.formulaEditor.fn.LOWER.example'),
      func: (...args: any[]) => {
        return args[0].toLowerCase()
      }
    },
    {
      name: 'TRIM',
      description: t('mdTable.formulaEditor.fn.TRIM.description'),
      usage: 'TRIM(text)',
      params: [{ name: 'text', description: t('mdTable.formulaEditor.fn.TRIM.param.text') }],
      example: t('mdTable.formulaEditor.fn.TRIM.example'),
      func: (...args: any[]) => {
        return args[0].trim()
      }
    }
  ]
}

/**
 * 数值函数列�?
 */
function toFiniteNumber(value: any, fallback = 0): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function toNonEmptyValue(value: any): any {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null
  }
  return value
}

export function getNumberFunctions(t: TFunction): FunctionItem[] {
  return [
  // {
  //   name: 'SUM',
  //   description: '计算一组数值的总和�?,
  //   usage: 'SUM(number1, number2, ...)',
  //   params: [
  //     { name: 'number1', description: '第一个数�? },
  //     { name: 'number2', description: '第二个数�? }
  //   ],
  //   example: 'SUM(10, 20, 30) 返回 60',
  //   func: (...args: any[]) => {
  //     return args.reduce((acc, curr) => acc + toFiniteNumber(curr, 0), 0)
  //   }
  // },
  // {
  //   name: 'AVERAGE',
  //   description: '计算一组数值的平均值�?,
  //   usage: 'AVERAGE(number1, number2, ...)',
  //   params: [
  //     { name: 'number1', description: '第一个数�? },
  //     { name: 'number2', description: '第二个数�? }
  //   ],
  //   example: 'AVERAGE(10, 20, 30) 返回 20',
  //   func: (...args: any[]) => {
  //     if (!args.length) {
  //       return 0
  //     }
  //     const values = args.map((item) => toFiniteNumber(item, 0))
  //     return values.reduce((acc, curr) => acc + curr, 0) / values.length
  //   }
  // },
  {
    name: 'GREATEST',
    description: t('mdTable.formulaEditor.fn.GREATEST.description'),
    usage: 'GREATEST(number1, number2, ...)',
    params: [
      { name: 'number1', description: t('mdTable.formulaEditor.fn.GREATEST.param.number1') },
      { name: 'number2', description: t('mdTable.formulaEditor.fn.GREATEST.param.number2') }
    ],
    example: t('mdTable.formulaEditor.fn.GREATEST.example'),
    func: (...args: any[]) => {
      if (!args.length) {
        return 0
      }
      return Math.max(...args.map((item) => toFiniteNumber(item, Number.NEGATIVE_INFINITY)))
    }
  },
  {
    name: 'LEAST',
    description: t('mdTable.formulaEditor.fn.LEAST.description'),
    usage: 'LEAST(number1, number2, ...)',
    params: [
      { name: 'number1', description: t('mdTable.formulaEditor.fn.LEAST.param.number1') },
      { name: 'number2', description: t('mdTable.formulaEditor.fn.LEAST.param.number2') }
    ],
    example: t('mdTable.formulaEditor.fn.LEAST.example'),
    func: (...args: any[]) => {
      if (!args.length) {
        return 0
      }
      return Math.min(...args.map((item) => toFiniteNumber(item, Number.POSITIVE_INFINITY)))
    }
  },
  {
    name: 'ROUND',
    description: t('mdTable.formulaEditor.fn.ROUND.description'),
    usage: 'ROUND(number, num_digits)',
    params: [
      { name: 'number', description: t('mdTable.formulaEditor.fn.ROUND.param.number') },
      { name: 'num_digits', description: t('mdTable.formulaEditor.fn.ROUND.param.num_digits') }
    ],
    example: t('mdTable.formulaEditor.fn.ROUND.example'),
    func: (...args: any[]) => {
      const number = toFiniteNumber(args[0], 0)
      const numDigits = Math.trunc(toFiniteNumber(args[1], 0))
      if (numDigits >= 0) {
        const factor = Math.pow(10, Math.min(numDigits, 20))
        return Math.round((number + Number.EPSILON) * factor) / factor
      }
      const factor = Math.pow(10, Math.min(Math.abs(numDigits), 20))
      return Math.round((number + Number.EPSILON) / factor) * factor
    }
  },
  {
    name: 'CEIL',
    description: t('mdTable.formulaEditor.fn.CEIL.description'),
    usage: 'CEIL(number)',
    params: [{ name: 'number', description: t('mdTable.formulaEditor.fn.CEIL.param.number') }],
    example: t('mdTable.formulaEditor.fn.CEIL.example'),
    func: (...args: any[]) => {
      return Math.ceil(toFiniteNumber(args[0], 0))
    }
  },
  {
    name: 'FLOOR',
    description: t('mdTable.formulaEditor.fn.FLOOR.description'),
    usage: 'FLOOR(number)',
    params: [{ name: 'number', description: t('mdTable.formulaEditor.fn.FLOOR.param.number') }],
    example: t('mdTable.formulaEditor.fn.FLOOR.example'),
    func: (...args: any[]) => {
      return Math.floor(toFiniteNumber(args[0], 0))
    }
  },
  {
    name: 'ABS',
    description: t('mdTable.formulaEditor.fn.ABS.description'),
    usage: 'ABS(number)',
    params: [{ name: 'number', description: t('mdTable.formulaEditor.fn.ABS.param.number') }],
    example: t('mdTable.formulaEditor.fn.ABS.example'),
    func: (...args: any[]) => {
      return Math.abs(toFiniteNumber(args[0], 0))
    }
  },
  {
    name: 'SQRT',
    description: t('mdTable.formulaEditor.fn.SQRT.description'),
    usage: 'SQRT(number)',
    params: [{ name: 'number', description: t('mdTable.formulaEditor.fn.SQRT.param.number') }],
    example: t('mdTable.formulaEditor.fn.SQRT.example'),
    func: (...args: any[]) => {
      const number = toFiniteNumber(args[0], 0)
      if (number < 0) {
        return ''
      }
      const result = Math.sqrt(number)
      return Number.isFinite(result) ? result : ''
    }
  },
  {
    name: 'POWER',
    description: t('mdTable.formulaEditor.fn.POWER.description'),
    usage: 'POWER(base, exponent)',
    params: [
      { name: 'base', description: t('mdTable.formulaEditor.fn.POWER.param.base') },
      { name: 'exponent', description: t('mdTable.formulaEditor.fn.POWER.param.exponent') }
    ],
    example: t('mdTable.formulaEditor.fn.POWER.example'),
    func: (...args: any[]) => {
      const base = toFiniteNumber(args[0], 0)
      const exponent = toFiniteNumber(args[1], 0)
      const result = Math.pow(base, exponent)
      return Number.isFinite(result) ? result : ''
    }
  },
  {
    name: 'MOD',
    description: t('mdTable.formulaEditor.fn.MOD.description'),
    usage: 'MOD(dividend, divisor)',
    params: [
      { name: 'dividend', description: t('mdTable.formulaEditor.fn.MOD.param.dividend') },
      { name: 'divisor', description: t('mdTable.formulaEditor.fn.MOD.param.divisor') }
    ],
    example: t('mdTable.formulaEditor.fn.MOD.example'),
    func: (...args: any[]) => {
      const dividend = toFiniteNumber(args[0], 0)
      const divisor = toFiniteNumber(args[1], 0)
      if (divisor === 0) {
        return ''
      }
      return dividend % divisor
    }
  },
  {
    name: 'COALESCE',
    description: t('mdTable.formulaEditor.fn.COALESCE.description'),
    usage: 'COALESCE(value, default_value)',
    params: [
      { name: 'value', description: t('mdTable.formulaEditor.fn.COALESCE.param.value') },
      { name: 'default_value', description: t('mdTable.formulaEditor.fn.COALESCE.param.default_value') }
    ],
    example: t('mdTable.formulaEditor.fn.COALESCE.example'),
    func: (...args: any[]) => {
      const value = toNonEmptyValue(args[0])
      if (value === null) {
        return args[1] ?? ''
      }
      return value
    }
  }
  ]
}

/**
 * 日期函数列表
 */
export function getDateFunctions(t: TFunction): FunctionItem[] {
  return [
  {
    name: 'FORMAT_DATE',
    description: t('mdTable.formulaEditor.fn.FORMAT_DATE.description'),
    usage: 'FORMAT_DATE(date, format)',
    params: [
      { name: 'date', description: t('mdTable.formulaEditor.fn.FORMAT_DATE.param.date') },
      { name: 'format', description: t('mdTable.formulaEditor.fn.FORMAT_DATE.param.format') }
    ],
    example: t('mdTable.formulaEditor.fn.FORMAT_DATE.example'),
    func: (...args: any[]) => {
      if(!args[0]) {
        return ''
      }
      return dayjs(args[0]).format(args[1])
    }
  },
  {
    name: 'TODAY',
    description: t('mdTable.formulaEditor.fn.TODAY.description'),
    usage: 'TODAY()',
    example: t('mdTable.formulaEditor.fn.TODAY.example'),
    func: () => {
      return new Date().toISOString().split('T')[0]
    }
  },
  {
    name: 'NOW',
    description: t('mdTable.formulaEditor.fn.NOW.description'),
    usage: 'NOW()',
    example: t('mdTable.formulaEditor.fn.NOW.example'),
    func: () => {
      return new Date().toISOString()
    }
  },
  {
    name: 'YEAR',
    description: t('mdTable.formulaEditor.fn.YEAR.description'),
    usage: 'YEAR(date)',
    params: [{ name: 'date', description: t('mdTable.formulaEditor.fn.YEAR.param.date') }],
    example: t('mdTable.formulaEditor.fn.YEAR.example'),
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date()
      return new Date(date).getFullYear()
    }
  },
  {
    name: 'MONTH',
    description: t('mdTable.formulaEditor.fn.MONTH.description'),
    usage: 'MONTH(date)',
    params: [{ name: 'date', description: t('mdTable.formulaEditor.fn.MONTH.param.date') }],
    example: t('mdTable.formulaEditor.fn.MONTH.example'),
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date()
      return new Date(date).getMonth() + 1
    }
  },
  {
    name: 'DAY',
    description: t('mdTable.formulaEditor.fn.DAY.description'),
    usage: 'DAY(date)',
    params: [{ name: 'date', description: t('mdTable.formulaEditor.fn.DAY.param.date') }],
    example: t('mdTable.formulaEditor.fn.DAY.example'),
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date()
      return new Date(date).getDate()
    }
  },
  {
    name: 'DATEDIF',
    description: t('mdTable.formulaEditor.fn.DATEDIF.description'),
    usage: 'DATEDIF(start_date, end_date, unit)',
    params: [
      { name: 'start_date', description: t('mdTable.formulaEditor.fn.DATEDIF.param.start_date') },
      { name: 'end_date', description: t('mdTable.formulaEditor.fn.DATEDIF.param.end_date') },
      { name: 'unit', description: t('mdTable.formulaEditor.fn.DATEDIF.param.unit') }
    ],
    example: t('mdTable.formulaEditor.fn.DATEDIF.example'),
    func: (...args: any[]) => {
      const unitRaw = String(args[2] ?? '')
        .trim()
        .toUpperCase()
      const unitMap: Record<string, dayjs.OpUnitType> = {
        D: 'day',
        DAY: 'day',
        DAYS: 'day',
        M: 'month',
        MON: 'month',
        MONTH: 'month',
        MONTHS: 'month',
        Y: 'year',
        YEAR: 'year',
        YEARS: 'year'
      }
      const unit = unitMap[unitRaw] ?? 'day'
      const start = dayjs(args[0])
      const end = dayjs(args[1])
      if (!start.isValid() || !end.isValid()) {
        return ''
      }
      // 依照 Excel 语义，计�?end - start
      return end.diff(start, unit)
    }
  }
  ]
}

function isFormulaValueMatch(left: any, right: any): boolean {
  if (left === right) {
    return true
  }
  if (left != null && right != null && String(left) === String(right)) {
    return true
  }
  const leftNum = Number(left)
  const rightNum = Number(right)
  return Number.isFinite(leftNum) && Number.isFinite(rightNum) && leftNum === rightNum
}

/** CASE(condition1, result1, condition2, result2, ..., [default]) */
function evalCase(args: any[]): any {
  if (!args.length) {
    return ''
  }

  const hasDefault = args.length % 2 === 1
  const defaultValue = hasDefault ? args[args.length - 1] : ''
  const branchCount = hasDefault ? (args.length - 1) / 2 : args.length / 2

  for (let i = 0; i < branchCount; i++) {
    const condition = args[i * 2]
    const result = args[i * 2 + 1]
    if (condition) {
      return result
    }
  }
  return defaultValue
}

/**
 * 逻辑函数列表
 */
export function getLogicalFunctions(t: TFunction): FunctionItem[] {
  return [
  {
    name: 'IF',
    description: t('mdTable.formulaEditor.fn.IF.description'),
    usage: 'IF(logical, value1, value2)',
    params: [
      { name: 'logical', description: t('mdTable.formulaEditor.fn.IF.param.logical') },
      { name: 'value1', description: t('mdTable.formulaEditor.fn.IF.param.value1') },
      { name: 'value2', description: t('mdTable.formulaEditor.fn.IF.param.value2') }
    ],
    example: t('mdTable.formulaEditor.fn.IF.example'),
    func: (...args: any[]) => {
      return args[0] ? args[1] : args[2]
    }
  },
  {
    name: 'CASE',
    description: t('mdTable.formulaEditor.fn.CASE.description'),
    usage: 'CASE(condition1, result1, condition2, result2, ..., default)',
    params: [
      { name: 'condition1', description: t('mdTable.formulaEditor.fn.CASE.param.condition1') },
      { name: 'result1', description: t('mdTable.formulaEditor.fn.CASE.param.result1') },
      { name: 'default', description: t('mdTable.formulaEditor.fn.CASE.param.default') }
    ],
    example: t('mdTable.formulaEditor.fn.CASE.example'),
    func: evalCase
  },
  {
    name: 'AND',
    description: t('mdTable.formulaEditor.fn.AND.description'),
    usage: 'AND(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: t('mdTable.formulaEditor.fn.AND.param.logical1') },
      { name: 'logical2', description: t('mdTable.formulaEditor.fn.AND.param.logical2') }
    ],
    example: t('mdTable.formulaEditor.fn.AND.example'),
    func: (...args: any[]) => {
      return args.every((arg) => arg)
    }
  },
  {
    name: 'OR',
    description: t('mdTable.formulaEditor.fn.OR.description'),
    usage: 'OR(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: t('mdTable.formulaEditor.fn.OR.param.logical1') },
      { name: 'logical2', description: t('mdTable.formulaEditor.fn.OR.param.logical2') }
    ],
    example: t('mdTable.formulaEditor.fn.OR.example'),
    func: (...args: any[]) => {
      return args.some((arg) => arg)
    }
  },
  {
    name: 'NOT',
    description: t('mdTable.formulaEditor.fn.NOT.description'),
    usage: 'NOT(logical)',
    params: [{ name: 'logical', description: t('mdTable.formulaEditor.fn.NOT.param.logical') }],
    example: t('mdTable.formulaEditor.fn.NOT.example'),
    func: (...args: any[]) => {
      return !args[0]
    }
  },
  {
    name: 'TRUE',
    description: t('mdTable.formulaEditor.fn.TRUE.description'),
    usage: 'TRUE()',
    example: t('mdTable.formulaEditor.fn.TRUE.example'),
    func: () => {
      return true
    }
  },
  {
    name: 'FALSE',
    description: t('mdTable.formulaEditor.fn.FALSE.description'),
    usage: 'FALSE()',
    example: t('mdTable.formulaEditor.fn.FALSE.example'),
    func: () => {
      return false
    }
  },
  {
    name: 'IS_BLANK',
    description: t('mdTable.formulaEditor.fn.IS_BLANK.description'),
    usage: 'IS_BLANK(value)',
    params: [{ name: 'value', description: t('mdTable.formulaEditor.fn.IS_BLANK.param.value') }],
    example: t('mdTable.formulaEditor.fn.IS_BLANK.example'),
    func: (...args: any[]) => {
      return args[0] === ''
    }
  },
  {
    name: 'IS_ERROR',
    description: t('mdTable.formulaEditor.fn.IS_ERROR.description'),
    usage: 'IS_ERROR(value)',
    params: [{ name: 'value', description: t('mdTable.formulaEditor.fn.IS_ERROR.param.value') }],
    example: t('mdTable.formulaEditor.fn.IS_ERROR.example'),
    func: (...args: any[]) => {
      return args[0] === 'error'
    }
  }
  ]
}

/**
 * 合并所有函数到一个映射中
 */
function getAllFunctions(): Map<string, FunctionItem> {
  const identity = (key: string) => key
  const functionMap = new Map<string, FunctionItem>()
  const allFunctions = [...getTextFunctions(identity), ...getNumberFunctions(identity), ...getDateFunctions(identity), ...getLogicalFunctions(identity)]
  allFunctions.forEach((func) => {
    if (func.func) {
      functionMap.set(func.name.toUpperCase(), func)
    }
  })
  return functionMap
}

/**
 * 查找函数调用的结束位置（匹配括号�?
 * @param str - 要搜索的字符�?
 * @param startPos - 开始位置（左括号的位置�?
 * @returns 函数调用的结束位置（右括号的位置），如果未找到返�?-1
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
 * 解析函数参数
 * @param argsStr - 参数字符�?
 * @param rowdata - 行数�?
 * @param functionMap - 函数映射
 * @returns 解析后的参数数组
 */
function parseFunctionArgs(argsStr: string, rowdata: any, functionMap: Map<string, FunctionItem>): any[] {
  if (!argsStr.trim()) {
    return []
  }

  const args: any[] = []
  let currentArg = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]

    if (!inString && (char === "'" || char === '"')) {
      inString = true
      stringChar = char
      currentArg += char
    } else if (inString && char === stringChar && argsStr[i - 1] !== '\\') {
      inString = false
      currentArg += char
    } else if (!inString && char === '(') {
      depth++
      currentArg += char
    } else if (!inString && char === ')') {
      depth--
      currentArg += char
    } else if (!inString && depth === 0 && char === ',') {
      // 找到参数分隔符，递归计算参数�?
      // 判断currentArg是否为日期类型，日期类型转换为时间戳

      if (dayjs(currentArg.trim()).isValid()) {
        args.push(dayjs(currentArg).valueOf())
      } else {
        args.push(evalFormula(currentArg.trim(), rowdata))
      }
      currentArg = ''
    } else {
      currentArg += char
    }
  }

  if (currentArg.trim()) {
    const argValue = evalFormula(currentArg.trim(), rowdata)
    args.push(argValue)
  }

  return args
}

/**
 * 替换变量引用为实际�?
 * @param formula - 公式字符�?
 * @param rowdata - 行数�?
 * @returns 替换后的公式
 */
function formatVariableValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '""'
  }
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return String(value)
}

function replaceVariables(formula: string, rowdata: any): string {
  const fieldNames = Object.keys(rowdata || {}).sort((a, b) => b.length - a.length)
  if (!fieldNames.length) {
    return formula
  }

  let result = ''
  let index = 0
  let inString = false
  let stringChar = ''

  while (index < formula.length) {
    const char = formula[index]

    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
      result += char
      index++
      continue
    }

    if (inString) {
      result += char
      if (char === '\\' && index + 1 < formula.length) {
        result += formula[index + 1]
        index += 2
        continue
      }
      if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      index++
      continue
    }

    let matched = false
    for (const fieldName of fieldNames) {
      if (formula.startsWith(fieldName, index)) {
        result += formatVariableValue(rowdata[fieldName])
        index += fieldName.length
        matched = true
        break
      }
    }

    if (!matched) {
      result += char
      index++
    }
  }

  return result
}

/**
 * 替换函数调用为实际�?
 * @param formula - 公式字符�?
 * @param rowdata - 行数�?
 * @param functionMap - 函数映射
 * @returns 替换后的公式
 */
function replaceFunctions(formula: string, rowdata: any, functionMap: Map<string, FunctionItem>): string {
  const functionNamePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g
  let result = formula
  let changed = true

  // 循环处理，直到没有更多函数调用需要替�?
  while (changed) {
    changed = false
    const matches: Array<{ name: string; start: number; end: number; argsStr: string }> = []

    // 重置正则表达式，使用 matchAll 来避�?exec 的状态问�?
    const allMatches = Array.from(result.matchAll(functionNamePattern))

    for (const match of allMatches) {
      const funcName = match[1].toUpperCase()
      const funcStart = match.index!
      const leftParenPos = funcStart + match[0].length - 1

      if (functionMap.has(funcName)) {
        const funcEnd = findFunctionEnd(result, leftParenPos)
        if (funcEnd > 0) {
          const argsStr = result.substring(leftParenPos + 1, funcEnd)
          matches.push({
            name: funcName,
            start: funcStart,
            end: funcEnd + 1,
            argsStr: argsStr
          })
        }
      }
    }

    // 从后往前替换，避免位置偏移问题
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i]
      const func = functionMap.get(match.name)!
      const args = parseFunctionArgs(match.argsStr, rowdata, functionMap)
      let funcResult

      try {
        if (func.func) {
          funcResult = func.func(...args)
        } else {
          funcResult = ''
        }

        // 将结果转换为字符串，如果是字符串需要加引号
        let resultStr: string
        if (typeof funcResult === 'string') {
          resultStr = `"${funcResult.replace(/"/g, '\\"')}"`
        } else if (funcResult === null || funcResult === undefined) {
          resultStr = '""'
        } else {
          resultStr = String(funcResult)
        }

        const beforeReplace = result
        result = result.substring(0, match.start) + resultStr + result.substring(match.end)

        if (beforeReplace !== result) {
          changed = true
          // 只替换一个函数就退出循环，重新查找所有函数调�?
          break
        }
      } catch (error) {
        console.error(`Error executing function ${match.name}:`, error)
        result = result.substring(0, match.start) + '""' + result.substring(match.end)
        changed = true
        break
      }
    }
  }

  return result
}

/**
 * 计算公式
 * @param formula - 公式字符�?
 * @param rowdata - 行数据对�?
 * @returns 计算结果
 */
export function evalFormula(formula: string, rowdata: any = {}): any {
  if (!formula || !formula.trim()) {
    return ''
  }

  let processedFormula = formula
  try {
    processedFormula = formula
    // 第一步：替换变量引用
    const functionMap = getAllFunctions()
    // 第二步：替换函数调用（需要递归处理嵌套函数�?
    processedFormula = replaceVariables(formula, rowdata)
    let lastFormula = ''
    let iterations = 0
    while (processedFormula !== lastFormula && iterations < 100) {
      lastFormula = processedFormula
      processedFormula = replaceFunctions(processedFormula, rowdata, functionMap)
      iterations++
    }
    // 第三步：处理字符串连接（将字符串�?+ 转换为连接操作）
    // 由于我们已经将字符串用引号包裹，JavaScript �?+ 运算符会自动处理字符串连�?
  
    // 第四步：安全地执行计�?
    // 使用 Function 构造函数而不�?eval，相对更安全
    if (!isExpressionBalanced(processedFormula)) {
      return ''
    }
    if (!processedFormula || processedFormula.trim() === '') {
      return ''
    }
    console.log('processedFormula', processedFormula)
    const result = new Function('return (' + processedFormula + ')')()
    // 返回结果，确保不�?undefined
    return result !== undefined ? result : ''
  } catch (error) {
    console.error('Formula evaluation error:', error)
    console.error('Formula:', formula)
    console.error('Processed formula:', processedFormula)
    return ''
  }
}
