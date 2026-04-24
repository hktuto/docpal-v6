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
