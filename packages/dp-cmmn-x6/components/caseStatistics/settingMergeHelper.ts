export function mergeSetting(settingJson: any, setupJson: any, styleJson: any = null) {
  const mergedJson = JSON.parse(JSON.stringify(settingJson))
  if (Array.isArray(mergedJson?.widgetList)) {
    const setupGrid = findSetupGrid(mergedJson, 'setupGrid')
    if(setupGrid) {
      setupGrid.widgetList.push(...setupJson.widgetList)
    }
  }
  console.log('styleGrid', styleJson)
  if (Array.isArray(styleJson?.widgetList)) {
    const styleGrid = findSetupGrid(mergedJson, 'styleGrid')
    console.log('styleGrid', styleGrid)
    if(styleGrid) {
      styleGrid.widgetList.push(...styleJson.widgetList)
    }
  }
  // if (Array.isArray(styleJson?.widgetList)) {
  //   widgetList.push(...styleJson.widgetList)
  // }

  return mergedJson
}

export function findSetupGrid(json: any, name: string = 'setupGrid'): any | null {
  if (!json || typeof json !== 'object') {
    return null
  }

  const currentName = json.options?.name ?? json.name
  if (currentName === name) {
    return json
  }

  // 常见容器子节点字段
  const childLists = [
    json.widgetList,
    json.cols,
    json.tabs,
  ]

  for (const list of childLists) {
    if (!Array.isArray(list)) continue
    for (const child of list) {
      const found = findSetupGrid(child, name)
      if (found) return found
    }
  }

  // 兜底：扫描对象中所有数组字段，防止遗漏未知结构
  for (const value of Object.values(json)) {
    if (!Array.isArray(value)) continue
    for (const child of value) {
      const found = findSetupGrid(child, name)
      if (found) return found
    }
  }

  return null
}
