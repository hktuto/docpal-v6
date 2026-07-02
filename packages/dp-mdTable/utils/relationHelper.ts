import { index } from 'drizzle-orm/pg-core'
// row: {
//   [fieldName]: string[] | string
//   [displayFieldName]: string[] | string
// }
// fieldName: 关联字段名
// displayFieldName: 关联显示字段名
// return: { id: string, [displayFieldName]: string }[]
export function buildRelationArray(row: any, fieldName: string, displayFieldName: string | string[]) {
  if (!row[fieldName]) {
    return []
  }
  const displayFieldNames = Array.isArray(displayFieldName) ? displayFieldName : [displayFieldName]

  if (typeof row[fieldName] === 'string') {
    row[fieldName] = JSONParse(row[fieldName])
  }
  const fieldDataIds = Array.isArray(row[fieldName]) ? row[fieldName] : []
  const relationArray = fieldDataIds.map((id: string, index: number) => {
    const fieldItem: any = {
      id
    }
    displayFieldNames.forEach((fname: string) => {
      const displayFieldNameFull = fieldName + '.' + fname
      if (typeof row[displayFieldNameFull] === 'string') {
        row[displayFieldNameFull] = JSONParse(row[displayFieldNameFull])
      }
      const displayValues = Array.isArray(row[displayFieldNameFull]) ? row[displayFieldNameFull] : []
      fieldItem[fname] = displayValues[index] || '-'
    })
    return fieldItem
  })
  return relationArray
}
function JSONParse(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    if (!value || value.trim() === '') return []
    // 处理类似 "{item1,item2,item3}" 的格式
    if (value.startsWith('{') && value.endsWith('}')) {
      const inner = value.slice(1, -1).trim()
      if (inner === '') return []

      return inner.split(',').map((item) => item.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"'))
    }
  }
}
export interface RelationClickContext {
  relationTableId?: string
  relationFieldName?: string
  relationArray: any[]
  displayFieldName: string
}

export function dispatchRelationCellClick(
  $grid: any,
  e: MouseEvent,
  options: {
    targetTableId: string
    recordId: string
    displayValue: Record<string, any>
    title?: string
    relationField?: string
    row?: any
    column?: any
  }
) {
  e.stopPropagation()
  $grid.dispatchEvent(
    'relation-cell-click',
    {
      event: e,
      targetElement: e.currentTarget,
      targetTableId: options.targetTableId,
      recordId: options.recordId,
      displayValue: options.displayValue,
      title: options.title,
      relationField: options.relationField,
      row: options.row,
      column: options.column
    },
    e
  )
}

export function getRelationTagClickProps(
  $grid: any,
  params: { row: any; column: any },
  ctx: RelationClickContext | undefined,
  index: number,
  baseClass?: string
) {
  if (!ctx?.relationTableId) return baseClass ? { class: baseClass } : {}
  const val = ctx.relationArray[index]
  if (!val?.id) return baseClass ? { class: baseClass } : {}
  const className = baseClass ? `${baseClass} relation-tag el-icon--right` : 'relation-tag el-icon--right'
  return {
    class: className,
    onClick: (e: MouseEvent) => {
      dispatchRelationCellClick($grid, e, {
        targetTableId: ctx.relationTableId!,
        recordId: val.id,
        displayValue: val,
        title: val[ctx.displayFieldName],
        relationField: ctx.relationFieldName,
        row: params.row,
        column: params.column
      })
    }
  }
}

export function updateRelationFields(relationRowId: string, relationData: any, rowData: any, relationField: string) {
  if (!rowData[relationField]) return
  const index = rowData[relationField].findIndex((item: any) => item === relationRowId)
  if (index === -1) return
  Object.keys(relationData).forEach((key) => {
    rowData[key][index] = relationData[key]
  })
}
