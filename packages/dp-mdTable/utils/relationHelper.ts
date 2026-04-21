// row: {
//   [fieldName]: string[] | string
//   [displayFieldName]: string[] | string
// }
// fieldName: 关联字段名
// displayFieldName: 关联显示字段名
// return: { id: string, displayValue: string }[]
export function buildRelationArray(row: any, fieldName: string, displayFieldName: string) {
  if (!row[fieldName]) {
    return []
  }
  let displayFieldNameFull = fieldName + '.' + displayFieldName
  if (typeof row[fieldName] === 'string') {
    row[fieldName] = JSONParse(row[fieldName])
  }
  if (typeof row[displayFieldNameFull] === 'string') {
    row[displayFieldNameFull] = JSONParse(row[displayFieldNameFull])
  }
  const fieldDataIds = Array.isArray(row[fieldName]) ? row[fieldName] : []
  const displayValues = Array.isArray(row[displayFieldNameFull]) ? row[displayFieldNameFull] : []
  const relationArray = fieldDataIds.map((id: string, index: number) => {
    return {
      id,
      displayFieldName: displayValues[index] || '-'
    }
  })
  return relationArray
}
function JSONParse(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    if(!value) return []
    return value.slice(1, -1).split(',').map((item: string) => item.trim().replaceAll('"', ''))
  }
}
