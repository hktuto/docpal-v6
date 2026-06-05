import type { Variable } from './formulaValid'

export interface VariableMatch {
  start: number
  end: number
  variable: Variable
  token: string
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str: string) {
  return escapeHtml(str).replace(/'/g, '&#39;')
}

function applyVariableMatches(
  formula: string,
  matches: VariableMatch[],
  getReplacement: (variable: Variable) => string
): string {
  if (!matches.length) {
    return formula
  }
  let result = ''
  let last = 0
  for (const match of matches) {
    result += formula.slice(last, match.start)
    result += getReplacement(match.variable)
    last = match.end
  }
  result += formula.slice(last)
  return result
}

/**
 * 扫描公式中的变量（跳过字符串字面量）
 */
export function scanVariableMatches(text: string, variables: Variable[], mode: 'value' | 'label'): VariableMatch[] {
  const tokenEntries = variables
    .map((variable) => ({
      variable,
      token: mode === 'value' ? variable.value : variable.label
    }))
    .filter((entry) => entry.token.length > 0)
    .sort((a, b) => b.token.length - a.token.length)

  const matches: VariableMatch[] = []
  let index = 0
  let inString = false
  let stringChar = ''

  while (index < text.length) {
    const char = text[index]

    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
      index++
      continue
    }

    if (inString) {
      if (char === '\\' && index + 1 < text.length) {
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
    for (const entry of tokenEntries) {
      if (text.startsWith(entry.token, index)) {
        matches.push({
          start: index,
          end: index + entry.token.length,
          variable: entry.variable,
          token: entry.token
        })
        index += entry.token.length
        matched = true
        break
      }
    }

    if (!matched) {
      index++
    }
  }

  return matches
}

/** 存储格式 fieldId → 展示格式 label */
export function formulaIdsToLabels(formula: string, variables: Variable[]): string {
  if (!formula) {
    return ''
  }
  const matches = scanVariableMatches(formula, variables, 'value')
  return applyVariableMatches(formula, matches, (variable) => variable.label)
}

/** 展示格式 label → 存储格式 fieldId */
export function formulaLabelsToIds(formula: string, variables: Variable[]): string {
  if (!formula) {
    return ''
  }
  const matches = scanVariableMatches(formula, variables, 'label')
  return applyVariableMatches(formula, matches, (variable) => variable.value)
}

export function findVariableByToken(inner: string, variables: Variable[]) {
  return variables.find((item) => item.label === inner || item.value === inner)
}

export function buildFormulaEditorHtml(text: string, variables: Variable[]): string {
  if (!text) {
    return ''
  }

  let html = ''
  let lastIndex = 0
  const matches = scanVariableMatches(text, variables, 'label')

  for (const match of matches) {
    html += escapeHtml(text.slice(lastIndex, match.start))
    const token = match.variable.label
    html += `<span class="formula-variable-chip" contenteditable="false" data-formula-token="${escapeAttr(token)}">${escapeHtml(token)}</span>`
    lastIndex = match.end
  }

  html += escapeHtml(text.slice(lastIndex))
  return html.replace(/\n/g, '<br>')
}

export function extractFormulaDisplayText(root: HTMLElement): string {
  let result = ''

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || ''
      return
    }
    if (node.nodeName === 'BR') {
      result += '\n'
      return
    }
    if (!(node instanceof HTMLElement)) {
      return
    }
    if (node.dataset.formulaToken) {
      result += node.dataset.formulaToken
      return
    }
    node.childNodes.forEach(walk)
  }

  root.childNodes.forEach(walk)
  return result
}

export function textHasVariableTokens(text: string, variables: Variable[]): boolean {
  return scanVariableMatches(text, variables, 'label').length > 0
}
