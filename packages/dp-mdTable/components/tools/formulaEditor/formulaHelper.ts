/**
 * 公式函数定义
 */
import dayjs from 'dayjs'
export interface FunctionItem {
  name: string;
  description: string;
  usage: string;
  params?: Array<{
    name: string;
    description: string;
  }>;
  example?: string;
  func?: (...args: any[]) => any;
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
    example: "CONCAT('Hello', ' ', 'World') 返回 'Hello World'",
    func: (...args: any[]) => {
      return args.join('')
    }
  },
  {
    name: 'LEFT',
    description: '从文本字符串的左侧提取指定数量的字符。',
    usage: 'LEFT(text, num_chars)',
    params: [
      { name: 'text', description: '要提取字符的文本字符串' },
      { name: 'num_chars', description: '要提取的字符数量' }
    ],
    example: "LEFT('Hello World', 5) 返回 'Hello'",
    func: (...args: any[]) => {
      return args[0].slice(0, args[1])
    }
  },
  {
    name: 'RIGHT',
    description: '从文本字符串的右侧提取指定数量的字符。',
    usage: 'RIGHT(text, num_chars)',
    params: [
      { name: 'text', description: '要提取字符的文本字符串' },
      { name: 'num_chars', description: '要提取的字符数量' }
    ],
    example: "RIGHT('Hello World', 5) 返回 'World'",
    func: (...args: any[]) => {
      return args[0].slice(-args[1])
    }
  },
  {
    name: 'LEN',
    description: '返回文本字符串的字符长度。',
    usage: 'LEN(text)',
    params: [{ name: 'text', description: '要计算长度的文本字符串' }],
    example: "LEN('Hello') 返回 5",
    func: (...args: any[]) => {
      return args[0].length
    }
  },
  {
    name: 'UPPER',
    description: '将文本字符串转换为大写。',
    usage: 'UPPER(text)',
    params: [{ name: 'text', description: '要转换为大写的文本字符串' }],
    example: "UPPER('hello') 返回 'HELLO'",
    func: (...args: any[]) => {
      return args[0].toUpperCase()
    }
  },
  {
    name: 'LOWER',
    description: '将文本字符串转换为小写。',
    usage: 'LOWER(text)',
    params: [{ name: 'text', description: '要转换为小写的文本字符串' }],
    example: "LOWER('HELLO') 返回 'hello'",
    func: (...args: any[]) => {
      return args[0].toLowerCase()
    }
  },
  {
    name: 'TRIM',
    description: '移除文本字符串首尾的空格。',
    usage: 'TRIM(text)',
    params: [{ name: 'text', description: '要移除空格的文本字符串' }],
    example: "TRIM('  Hello  ') 返回 'Hello'",
    func: (...args: any[]) => {
      return args[0].trim()
    }
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
    example: 'SUM(10, 20, 30) 返回 60',
    func: (...args: any[]) => {
      return args.reduce((acc, curr) => acc + curr, 0)
    }
  },
  {
    name: 'AVERAGE',
    description: '计算一组数值的平均值。',
    usage: 'AVERAGE(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'AVERAGE(10, 20, 30) 返回 20',
    func: (...args: any[]) => {
      return args.reduce((acc, curr) => acc + curr, 0) / args.length
    }
  },
  {
    name: 'MAX',
    description: '返回一组数值中的最大值。',
    usage: 'MAX(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'MAX(10, 20, 30) 返回 30',
    func: (...args: any[]) => {
      return Math.max(...args)
    }
  },
  {
    name: 'MIN',
    description: '返回一组数值中的最小值。',
    usage: 'MIN(number1, number2, ...)',
    params: [
      { name: 'number1', description: '第一个数值' },
      { name: 'number2', description: '第二个数值' }
    ],
    example: 'MIN(10, 20, 30) 返回 10',
    func: (...args: any[]) => {
      return Math.min(...args)
    }
  },
  {
    name: 'ROUND',
    description: '将数值四舍五入到指定的小数位数。',
    usage: 'ROUND(number, num_digits)',
    params: [
      { name: 'number', description: '要四舍五入的数值' },
      { name: 'num_digits', description: '小数位数' }
    ],
    example: 'ROUND(3.14159, 2) 返回 3.14',
    func: (...args: any[]) => {
      return Math.round(args[0])
    }
  },
  {
    name: 'ABS',
    description: '返回数值的绝对值。',
    usage: 'ABS(number)',
    params: [{ name: 'number', description: '要计算绝对值的数值' }],
    example: 'ABS(-10) 返回 10',
    func: (...args: any[]) => {
      return Math.abs(args[0])
    }
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
    example: 'TODAY() 返回当前日期，例如 2024-01-15',
    func: () => {
      return new Date().toISOString().split('T')[0]
    }
  },
  {
    name: 'NOW',
    description: '返回当前日期和时间。',
    usage: 'NOW()',
    example: 'NOW() 返回当前日期和时间，例如 2024-01-15 14:30:00',
    func: () => {
      return new Date().toISOString()
    }
  },
  {
    name: 'YEAR',
    description: '从日期中提取年份。如果没有参数，返回当前年份。',
    usage: 'YEAR(date)',
    params: [{ name: 'date', description: '日期值（可选，默认为当前日期）' }],
    example: 'YEAR() 或 YEAR(TODAY()) 返回当前年份，例如 2024',
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date();
      return new Date(date).getFullYear();
    }
  },
  {
    name: 'MONTH',
    description: '从日期中提取月份（1-12）。如果没有参数，返回当前月份。',
    usage: 'MONTH(date)',
    params: [{ name: 'date', description: '日期值（可选，默认为当前日期）' }],
    example: 'MONTH() 或 MONTH(TODAY()) 返回当前月份，例如 1',
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date();
      return new Date(date).getMonth() + 1;
    }
  },
  {
    name: 'DAY',
    description: '从日期中提取日期（1-31）。如果没有参数，返回当前日期。',
    usage: 'DAY(date)',
    params: [{ name: 'date', description: '日期值（可选，默认为当前日期）' }],
    example: 'DAY() 或 DAY(TODAY()) 返回当前日期，例如 15',
    func: (...args: any[]) => {
      const date = args.length > 0 && args[0] ? args[0] : new Date();
      return new Date(date).getDate();
    }
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
    example: "DATEDIF('2024-01-01', '2024-12-31', 'D') 返回 365",
    func: (...args: any[]) => {
      return dayjs(args[0]).diff(dayjs(args[1]), args[2])
    }
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
    example: "IF(10 > 5, '是', '否') 返回 '是'",
    func: (...args: any[]) => {
      return args[0] ? args[1] : args[2]
    }
  },
  {
    name: 'AND',
    description: '如果所有参数都为真，则返回真；否则返回假。',
    usage: 'AND(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: '第一个逻辑条件' },
      { name: 'logical2', description: '第二个逻辑条件' }
    ],
    example: 'AND(10 > 5, 20 > 15) 返回 TRUE',
    func: (...args: any[]) => {
      return args.every(arg => arg)
    }
  },
  {
    name: 'OR',
    description: '如果任一参数为真，则返回真；否则返回假。',
    usage: 'OR(logical1, logical2, ...)',
    params: [
      { name: 'logical1', description: '第一个逻辑条件' },
      { name: 'logical2', description: '第二个逻辑条件' }
    ],
    example: 'OR(10 > 20, 5 > 3) 返回 TRUE',
    func: (...args: any[]) => {
      return args.some(arg => arg)
    }
  },
  {
    name: 'NOT',
    description: '对逻辑值取反。',
    usage: 'NOT(logical)',
    params: [{ name: 'logical', description: '要取反的逻辑值' }],
    example: 'NOT(TRUE) 返回 FALSE',
    func: (...args: any[]) => {
      return !args[0]
    }
  },
  {
    name: 'TRUE',
    description: '返回逻辑值真。',
    usage: 'TRUE()',
    example: 'TRUE() 返回 TRUE',
    func: () => {
      return true
    }
  },
  {
    name: 'FALSE',
    description: '返回逻辑值假。',
    usage: 'FALSE()',
    example: 'FALSE() 返回 FALSE',
    func: () => {
      return false
    }
  },
  {
    name: 'IS_BLANK',
    description: '检查值是否为空。',
    usage: 'IS_BLANK(value)',
    params: [{ name: 'value', description: '要检查的值' }],
    example: "IS_BLANK('') 返回 TRUE",
    func: (...args: any[]) => {
      return args[0] === ''
    }
  },
  {
    name: 'IS_ERROR',
    description: '检查值是否为错误。',
    usage: 'IS_ERROR(value)',
    params: [{ name: 'value', description: '要检查的值' }],
    example: 'IS_ERROR(1/0) 返回 TRUE',
    func: (...args: any[]) => {
      return args[0] === 'error'
    }
  }
];

/**
 * 合并所有函数到一个映射中
 */
function getAllFunctions(): Map<string, FunctionItem> {
  const functionMap = new Map<string, FunctionItem>();
  const allFunctions = [
    ...textFunctions,
    ...numberFunctions,
    ...dateFunctions,
    ...logicalFunctions
  ];
  allFunctions.forEach(func => {
    if (func.func) {
      functionMap.set(func.name.toUpperCase(), func);
    }
  });
  return functionMap;
}

/**
 * 查找函数调用的结束位置（匹配括号）
 * @param str - 要搜索的字符串
 * @param startPos - 开始位置（左括号的位置）
 * @returns 函数调用的结束位置（右括号的位置），如果未找到返回 -1
 */
function findFunctionEnd(str: string, startPos: number): number {
  if (startPos < 0 || startPos >= str.length || str[startPos] !== '(') {
    return -1;
  }

  let depth = 1;
  let pos = startPos + 1;

  while (pos < str.length && depth > 0) {
    if (str[pos] === '(') {
      depth++;
    } else if (str[pos] === ')') {
      depth--;
    } else if (str[pos] === "'" || str[pos] === '"') {
      // 跳过字符串字面量
      const quote = str[pos];
      pos++;
      while (pos < str.length && str[pos] !== quote) {
        if (str[pos] === '\\') {
          pos++; // 跳过转义字符
        }
        pos++;
      }
    }
    if (depth > 0) {
      pos++;
    }
  }

  return depth === 0 ? pos : -1;
}

/**
 * 解析函数参数
 * @param argsStr - 参数字符串
 * @param rowdata - 行数据
 * @param functionMap - 函数映射
 * @returns 解析后的参数数组
 */
function parseFunctionArgs(argsStr: string, rowdata: any, functionMap: Map<string, FunctionItem>): any[] {
  if (!argsStr.trim()) {
    return [];
  }

  const args: any[] = [];
  let currentArg = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      currentArg += char;
    } else if (inString && char === stringChar && argsStr[i - 1] !== '\\') {
      inString = false;
      currentArg += char;
    } else if (!inString && char === '(') {
      depth++;
      currentArg += char;
    } else if (!inString && char === ')') {
      depth--;
      currentArg += char;
    } else if (!inString && depth === 0 && char === ',') {
      // 找到参数分隔符，递归计算参数值
      const argValue = evalFormula(currentArg.trim(), rowdata);
      args.push(argValue);
      currentArg = '';
    } else {
      currentArg += char;
    }
  }

  if (currentArg.trim()) {
    const argValue = evalFormula(currentArg.trim(), rowdata);
    args.push(argValue);
  }

  return args;
}

/**
 * 替换变量引用为实际值
 * @param formula - 公式字符串
 * @param rowdata - 行数据
 * @returns 替换后的公式
 */
function replaceVariables(formula: string, rowdata: any): string {
  const variablePattern = /\{([^}]+)\}/g;
  return formula.replace(variablePattern, (match, fieldName) => {
    const value = rowdata?.[fieldName];
    if (value === undefined || value === null) {
      return '""';
    }
    // 如果是字符串，需要加引号
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return String(value);
  });
}

/**
 * 替换函数调用为实际值
 * @param formula - 公式字符串
 * @param rowdata - 行数据
 * @param functionMap - 函数映射
 * @returns 替换后的公式
 */
function replaceFunctions(formula: string, rowdata: any, functionMap: Map<string, FunctionItem>): string {
  const functionNamePattern = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let result = formula;

  // 从后往前替换，避免位置偏移问题
  const matches: Array<{ name: string; start: number; end: number; argsStr: string }> = [];
  
  // 重置正则表达式，使用 matchAll 来避免 exec 的状态问题
  const allMatches = Array.from(formula.matchAll(functionNamePattern));

  for (const match of allMatches) {
    const funcName = match[1].toUpperCase();
    const funcStart = match.index!;
    const leftParenPos = funcStart + match[0].length - 1;

    if (functionMap.has(funcName)) {
      const funcEnd = findFunctionEnd(formula, leftParenPos);
      if (funcEnd > 0) {
        const argsStr = formula.substring(leftParenPos + 1, funcEnd);
        matches.push({
          name: funcName,
          start: funcStart,
          end: funcEnd + 1,
          argsStr: argsStr
        });
      }
    }
  }

  // 从后往前替换
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const func = functionMap.get(match.name)!;
    const args = parseFunctionArgs(match.argsStr, rowdata, functionMap);
    let funcResult;

    try {
      if (func.func) {
        funcResult = func.func(...args);
      } else {
        funcResult = '';
      }

      // 将结果转换为字符串，如果是字符串需要加引号
      let resultStr: string;
      if (typeof funcResult === 'string') {
        resultStr = `"${funcResult.replace(/"/g, '\\"')}"`;
      } else if (funcResult === null || funcResult === undefined) {
        resultStr = '""';
      } else {
        resultStr = String(funcResult);
      }

      result = result.substring(0, match.start) + resultStr + result.substring(match.end);
    } catch (error) {
      console.error(`Error executing function ${match.name}:`, error);
      result = result.substring(0, match.start) + '""' + result.substring(match.end);
    }
  }

  return result;
}

/**
 * 计算公式
 * @param formula - 公式字符串
 * @param rowdata - 行数据对象
 * @returns 计算结果
 */
export function evalFormula(formula: string, rowdata: any = {}): any {
  if (!formula || !formula.trim()) {
    return '';
  }

  try {
    const functionMap = getAllFunctions();

    // 第一步：替换变量引用
    let processedFormula = replaceVariables(formula, rowdata);

    // 第二步：替换函数调用（需要递归处理嵌套函数）
    let lastFormula = '';
    let iterations = 0;
    while (processedFormula !== lastFormula && iterations < 100) {
      lastFormula = processedFormula;
      processedFormula = replaceFunctions(processedFormula, rowdata, functionMap);
      iterations++;
    }

    // 第三步：处理字符串连接（将字符串的 + 转换为连接操作）
    // 由于我们已经将字符串用引号包裹，JavaScript 的 + 运算符会自动处理字符串连接

    // 第四步：安全地执行计算
    // 使用 Function 构造函数而不是 eval，相对更安全
    const result = new Function('return (' + processedFormula + ')')();

    // 返回结果
    return result;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    console.error('Formula:', formula);
    return '';
  }
}
