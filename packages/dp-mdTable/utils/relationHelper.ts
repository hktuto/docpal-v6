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
  const fieldDataIds = Array.isArray(row[fieldName]) ? row[fieldName] : row[fieldName]?.split(',').filter((val: any) => val !== '') || []
  const displayValues = Array.isArray(row[displayFieldNameFull])
    ? row[displayFieldNameFull]
    : row[displayFieldNameFull]?.split(',').filter((val: any) => val !== '') || []
  const relationArray = fieldDataIds.map((id: string, index: number) => {
    return {
      id,
      displayFieldName: displayValues[index] || '-'
    }
  })
  return relationArray
}
