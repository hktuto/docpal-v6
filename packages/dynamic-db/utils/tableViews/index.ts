import type { ViewConfig, ViewColumn, SortInfo, GroupInfo, FilterInfo, ViewStyle } from '../db/schema/tableView'

const DEFAULT_SORT_INFO: SortInfo[] = [{ desc: false, fieldId: '' }]
const DEFAULT_FILTER_INFO: FilterInfo = { conditions: [], conjunction: 'AND' }
const DEFAULT_VIEW_STYLE: ViewStyle = {
  cardCount: 5,
  coverFieldId: '',
  isColNameVisible: true,
  isCoverFit: true,
}

/**
 * 从后端 columnConfig JSON 解析为 ViewConfig[]
 */
export function parseViewConfigList(jsonString: string | undefined): ViewConfig[] {
  if (!jsonString || jsonString.trim() === '') {
    return []
  }
  try {
    const parsed = JSON.parse(jsonString) as unknown
    return Array.isArray(parsed) ? (parsed as ViewConfig[]) : []
  } catch {
    return []
  }
}

/**
 * 将 ViewConfig[] 序列化为后端需要的 JSON string
 */
export function serializeViewConfigList(views: ViewConfig[]): string {
  const sanitized = views.map(({ displayColumns, ...rest }) => rest)
  return JSON.stringify(sanitized)
}

/**
 * 合并单个视图的局部更新，返回新 ViewConfig（不修改原对象）
 */
export function applyViewUpdates(view: ViewConfig, updates: Partial<ViewConfig>): ViewConfig {
  const data = {
    ...view,
    ...updates,
    columns: updates.columns !== undefined ? [...updates.columns] : view.columns,
    sortInfo: updates.sortInfo !== undefined ? [...updates.sortInfo] : view.sortInfo,
    groupInfo: updates.groupInfo !== undefined ? [...updates.groupInfo] : view.groupInfo,
    filterInfo:
      updates.filterInfo !== undefined
        ? {
            ...updates.filterInfo,
            conditions: [...updates.filterInfo.conditions]
          }
        : view.filterInfo
  }
  return data
}

/** 仅更新列（含顺序） */
export function updateViewColumns(view: ViewConfig, columns: ViewColumn[]): ViewConfig {
  return applyViewUpdates(view, { columns: [...columns] })
}
/** 仅更新名称 */
export function updateViewName(view: ViewConfig, name: string): ViewConfig {
  return applyViewUpdates(view, { name })
}

/**
 * 在列表末尾添加新视图；partial 会与默认值合并，id 由调用方传入
 */
export function addView(views: ViewConfig[], newView: Partial<ViewConfig> & { id: string }): ViewConfig[] {
  const baseName = newView.name ?? 'New View'
  let finalName = baseName
  let suffix = 1

  while (views.some((v) => v.name === finalName)) {
    finalName = `${baseName}${suffix}`
    suffix += 1
  }

  const view: ViewConfig = {
    id: newView.id,
    name: finalName,
    type: newView.type ?? 0,
    columns: newView.columns ?? [],
    sortInfo: newView.sortInfo ?? [...DEFAULT_SORT_INFO],
    groupInfo: newView.groupInfo ?? [],
    filterInfo: newView.filterInfo ?? { ...DEFAULT_FILTER_INFO },
    rowHeightLevel: newView.rowHeightLevel ?? 0
  }
  return [...views, view]
}

/**
 * 按 id 删除视图，返回新数组
 */
export function deleteView(views: ViewConfig[], viewId: string): ViewConfig[] {
  return views.filter((v) => v.id !== viewId)
}

/**
 * 调整视图在列表中的顺序；fromIndex/toIndex 为数组下标
 */
export function reorderViews(views: ViewConfig[], fromIndex: number, toIndex: number): ViewConfig[] {
  const list = [...views]
  const [item] = list.splice(fromIndex, 1)
  if (!item) return list
  list.splice(toIndex, 0, item)
  return list
}

/**
 * 在列表中按 id 查找并替换为更新后的视图
 */
export function replaceViewInList(views: ViewConfig[], viewId: string, updated: ViewConfig): ViewConfig[] {
  return views.map((v) => (v.id === viewId ? updated : v))
}

/**
 * 按 view.columns 的顺序重排 tableFields，返回与 tableFields 同类型的数组。
 * - view.columns 为空或未定义时，按 tableFields 原序返回
 * - view.columns 中缺少 fieldId 的项会被跳过
 * - 未在 view.columns 中出现的 tableField 会追加到末尾
 */
export function getDisplayColumns<T extends { id?: unknown; tableFieldId?: unknown }>(view: ViewConfig, tableFields: T[]): T[] {
  if (!Array.isArray(tableFields) || tableFields.length === 0) {
    return []
  }
  const columns = view?.columns ?? []

  const ordered: T[] = []
  const seenIds = new Set<string>()
  if (columns.length) {
    for (const col of columns) {
      const fieldId = col?.id ?? (col as any)?.id
      if (fieldId == null || fieldId === '') continue
      const idStr = String(fieldId)
      if (seenIds.has(idStr)) continue
      seenIds.add(idStr)
      const field = tableFields.find((f) => f.id === fieldId)
      if (!field) continue
      ordered.push({ ...field, ...col })
    }
  }

  for (const f of tableFields) {
    const id = f.id ?? f.tableFieldId
    if (id == null) continue
    const idStr = String(id)
    if (seenIds.has(idStr)) continue
    seenIds.add(idStr)
    ordered.push(f)
  }
  const result = ordered.map((c: any) => ({
    ...c,
    field: c.field_name,
    title: c.field_name_alias
  }))
  return result
}

/**
 * 根据列显隐配置更新 view.columns 中对应 column 的 hidden（display: true => hidden: false，display: false => hidden: true）
 */
export function updateViewColumnDisplay(view: ViewConfig, updates: Array<{ id: string; hidden: boolean }>, tableFields: any[]): ViewColumn[] {
  const fieldsById = new Map<string, any>()
  for (const f of tableFields ?? []) {
    if (f?.id == null) continue
    fieldsById.set(String(f.id), f)
  }

  const updatesById = new Map<string, boolean>()
  for (const u of updates ?? []) {
    if (u?.id == null) continue
    updatesById.set(String(u.id), Boolean(u.hidden))
  }
  const seen = new Set<string>()
  const nextColumns: ViewColumn[] = []

  // 1) 过滤 tableFields 不存在的数据 + 2) 按 columns 原有顺序排序
  for (const col of view?.columns ?? []) {
    const fieldId = col?.id
    if (fieldId == null) continue
    const key = String(fieldId)
    if (seen.has(key)) continue
    const tableField = fieldsById.get(key)
    if (!tableField) continue
    seen.add(key)

    const hidden = updatesById.get(key)
    const hasKey = updatesById.has(key)
    const tableFieldItem = tableFields.find((f: any) => f.id === fieldId)
    const item = {
      title: tableFieldItem.field_name_alias,
      id: String(tableField.id),
      hidden: hasKey ? (hidden === true ? true : false) : col.hidden
    }
    nextColumns.push(item)
  }

  // 3) 补充 tableFields 中存在但 columns 不存在的数据
  for (const f of tableFields ?? []) {
    if (f?.id == null) continue
    const key = String(f.id)
    if (seen.has(key)) continue
    seen.add(key)

    const hidden = updatesById.get(key)
    nextColumns.push({
      id: String(f.id),
      hidden: hidden === true ? true : false
    })
  }
  return nextColumns
}
export async function initViewColumnsOrder(columns: ViewColumn[], tableFields: any[]): Promise<ViewColumn[]> {
  const fieldsById = new Map<string, any>()
  for (const f of tableFields ?? []) {
    if (f?.id == null) continue
    fieldsById.set(String(f.id), f)
  }
  const columnsOrder: ViewColumn[] = []
  for (const col of columns) {
    if (col?.id == null) continue
    const key = String(col.id)
    const field = fieldsById.get(key)
    if (!field) continue
    columnsOrder.push({ ...col })
  }
  for (const f of tableFields ?? []) {
    if (f?.id == null) continue
    const key = String(f.id)
    if (columnsOrder.some((c) => c.id === key)) continue
    columnsOrder.push({ id: String(f.id), hidden: false })
  }
  return columnsOrder
}
export function updateViewColumnOrder(columns: ViewColumn[], columnId: string, position: number): ViewColumn[] {
  // const source = Array.isArray(view?.columns) ? view.columns : []
  const index = columns.findIndex((c) => c.id === columnId)
  if (index === -1) return columns
  columns.splice(position, 0, columns.splice(index, 1)[0])
  return columns
}
