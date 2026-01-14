/**
 * 公式函数定义
 */

export interface FunctionItem {
  name: string;
  description: string;
  usage: string;
  params?: Array<{
    name: string;
    description: string;
  }>;
  example?: string;
}

/**
 * 文本函数列表
 */
export const textFunctions: FunctionItem[] = [
  {
    name: 'CONCAT',
    description: '将多个文本字符串连接在一起。',
    usage: 'CONCAT(text1, text2, ...)',
    params: [
      { name: 'text1', description: '第一个文本字符串' },
      { name: 'text2', description: '第二个文本字符串' }
    ],
    example: "CONCAT('Hello', ' ', 'World') 返回 'Hello World'"
  },
  {
    name: 'LEFT',
    description: '从文本字符串的左侧提取指定数量的字符。',
    usage: 'LEFT(text, num_chars)',
    params: [
      { name: 'text', description: '要提取字符的文本字符串' },
      { name: 'num_chars', description: '要提取的字符数量' }
    ],
    example: "LEFT('Hello World', 5) 返回 'Hello'"
  },
  {
    name: 'RIGHT',
    description: '从文本字符串的右侧提取指定数量的字符。',
    usage: 'RIGHT(text, num_chars)',
    params: [
      { name: 'text', description: '要提取字符的文本字符串' },
      { name: 'num_chars', description: '要提取的字符数量' }
    ],
    example: "RIGHT('Hello World', 5) 返回 'World'"
  },
  {
    name: 'LEN',
    description: '返回文本字符串的字符长度。',
    usage: 'LEN(text)',
    params: [{ name: 'text', description: '要计算长度的文本字符串' }],
    example: "LEN('Hello') 返回 5"
  },
  {
    name: 'UPPER',
    description: '将文本字符串转换为大写。',
    usage: 'UPPER(text)',
    params: [{ name: 'text', description: '要转换为大写的文本字符串' }],
    example: "UPPER('hello') 返回 'HELLO'"
  },
  {
    name: 'LOWER',
    description: '将文本字符串转换为小写。',
    usage: 'LOWER(text)',
    params: [{ name: 'text', description: '要转换为小写的文本字符串' }],
    example: "LOWER('HELLO') 返回 'hello'"
  },
  {
    name: 'TRIM',
    description: '移除文本字符串首尾的空格。',
    usage: 'TRIM(text)',
    params: [{ name: 'text', description: '要移除空格的文本字符串' }],
    example: "TRIM('  Hello  ') 返回 'Hello'"
  }
];

/**
 * 数值函数列表
 */
export const numberFunctions: FunctionItem[] = [
  {
    name: 'SUM',
    description: '计算一组数值的总和。',
    usage: 'SUM(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'SUM(10, 20, 30) 返回 60'
  },
  {
    name: 'AVERAGE',
    description: '计算一组数值的平均值。',
    usage: 'AVERAGE(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'AVERAGE(10, 20, 30) 返回 20'
  },
  {
    name: 'MAX',
    description: '返回一组数值中的最大值。',
    usage: 'MAX(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'MAX(10, 20, 30) 返回 30'
  },
  {
    name: 'MIN',
    description: '返回一组数值中的最小值。',
    usage: 'MIN(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'MIN(10, 20, 30) 返回 10'
  },
  {
    name: 'ROUND',
    description: '将数值四舍五入到指定的小数位数。',
    usage: 'ROUND(number, num_digits)',
    params: [
      { name: 'number', description: '要四舍五入的数值' },
      { name: 'num_digits', description: '小数位数' }
    ],
    example: 'ROUND(3.14159, 2) 返回 3.14'
  },
  {
    name: 'ABS',
    description: '返回数值的绝对值。',
    usage: 'ABS(number)',
    params: [{ name: 'number', description: '要计算绝对值的数值' }],
    example: 'ABS(-10) 返回 10'
  }
];

/**
 * 日期函数列表
 */
export const dateFunctions: FunctionItem[] = [
  {
    name: 'TODAY',
    description: '返回当前日期。',
    usage: 'TODAY()',
    example: 'TODAY() 返回当前日期，例如 2024-01-15'
  },
  {
    name: 'NOW',
    description: '返回当前日期和时间。',
    usage: 'NOW()',
    example: 'NOW() 返回当前日期和时间，例如 2024-01-15 14:30:00'
  },
  {
    name: 'YEAR',
    description: '从日期中提取年份。',
    usage: 'YEAR(date)',
    params: [{ name: 'date', description: '日期值' }],
    example: 'YEAR(TODAY()) 返回当前年份，例如 2024'
  },
  {
    name: 'MONTH',
    description: '从日期中提取月份（1-12）。',
    usage: 'MONTH(date)',
    params: [{ name: 'date', description: '日期值' }],
    example: 'MONTH(TODAY()) 返回当前月份，例如 1'
  },
  {
    name: 'DAY',
    description: '从日期中提取日期（1-31）。',
    usage: 'DAY(date)',
    params: [{ name: 'date', description: '日期值' }],
    example: 'DAY(TODAY()) 返回当前日期，例如 15'
  },
  {
    name: 'DATEDIF',
    description: '计算两个日期之间的差值。',
    usage: 'DATEDIF(start_date, end_date, unit)',
    params: [
      { name: 'start_date', description: '开始日期' },
      { name: 'end_date', description: '结束日期' },
      { name: 'unit', description: '单位（"Y"年，"M"月，"D"天）' }
    ],
    example: "DATEDIF('2024-01-01', '2024-12-31', 'D') 返回 365"
  }
];

/**
 * 逻辑函数列表
 */
export const logicalFunctions: FunctionItem[] = [
  {
    name: 'IF',
    description: '判断是否满足某个条件，如果满足则返回第一个值，如果不满足则返回第二个值。',
    usage: 'IF(logical, value1, value2)',
    params: [
      { name: 'logical', description: '逻辑条件，一个计算结果为真或假的表达式' },
      { name: 'value1', description: '当逻辑条件为真时的返回值' },
      { name: 'value2', description: '当逻辑条件为假时的返回值' }
    ],
    example: "IF(10 > 5, '是', '否') 返回 '是'"
  },
  {
    name: 'AND',
    description: '如果所有参数都为真，则返回真；否则返回假。',
    usage: 'AND(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: '第一个逻辑条件' },
      { name: 'logical2', description: '第二个逻辑条件' }
    ],
    example: 'AND(10 > 5, 20 > 15) 返回 TRUE'
  },
  {
    name: 'OR',
    description: '如果任一参数为真，则返回真；否则返回假。',
    usage: 'OR(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: '第一个逻辑条件' },
      { name: 'logical2', description: '第二个逻辑条件' }
    ],
    example: 'OR(10 > 20, 5 > 3) 返回 TRUE'
  },
  {
    name: 'NOT',
    description: '对逻辑值取反。',
    usage: 'NOT(logical)',
    params: [{ name: 'logical', description: '要取反的逻辑值' }],
    example: 'NOT(TRUE) 返回 FALSE'
  },
  {
    name: 'TRUE',
    description: '返回逻辑值真。',
    usage: 'TRUE()',
    example: 'TRUE() 返回 TRUE'
  },
  {
    name: 'FALSE',
    description: '返回逻辑值假。',
    usage: 'FALSE()',
    example: 'FALSE() 返回 FALSE'
  },
  {
    name: 'IS_BLANK',
    description: '检查值是否为空。',
    usage: 'IS_BLANK(value)',
    params: [{ name: 'value', description: '要检查的值' }],
    example: "IS_BLANK('') 返回 TRUE"
  },
  {
    name: 'IS_ERROR',
    description: '检查值是否为错误。',
    usage: 'IS_ERROR(value)',
    params: [{ name: 'value', description: '要检查的值' }],
    example: 'IS_ERROR(1/0) 返回 TRUE'
  }
];

