import type { ViewConfig, ViewColumn, SortInfo, GroupInfo, FilterInfo } from '../db/schema/tableView'

const DEFAULT_SORT_INFO: SortInfo = { desc: false, fieldId: '' }
const DEFAULT_FILTER_INFO: FilterInfo = { conditions: [], conjunction: 'and' }

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
  return JSON.stringify(views)
}

/**
 * 合并单个视图的局部更新，返回新 ViewConfig（不修改原对象）
 */
export function applyViewUpdates(view: ViewConfig, updates: Partial<ViewConfig>): ViewConfig {
  return {
    ...view,
    ...updates,
    columns: updates.columns !== undefined ? [...updates.columns] : view.columns,
    sortInfo: updates.sortInfo !== undefined ? { ...updates.sortInfo } : view.sortInfo,
    groupInfo: updates.groupInfo !== undefined ? [...updates.groupInfo] : view.groupInfo,
    filterInfo:
      updates.filterInfo !== undefined
        ? {
            ...updates.filterInfo,
            conditions: [...updates.filterInfo.conditions]
          }
        : view.filterInfo
  }
}

/** 仅更新列（含顺序） */
export function updateViewColumns(view: ViewConfig, columns: ViewColumn[]): ViewConfig {
  return applyViewUpdates(view, { columns: [...columns] })
}

/** 仅更新排序 */
export function updateViewSortInfo(view: ViewConfig, sortInfo: SortInfo): ViewConfig {
  return applyViewUpdates(view, { sortInfo: { ...sortInfo } })
}

/** 仅更新分组 */
export function updateViewGroupInfo(view: ViewConfig, groupInfo: GroupInfo[]): ViewConfig {
  return applyViewUpdates(view, { groupInfo: [...groupInfo] })
}

/** 仅更新过滤 */
export function updateViewFilterInfo(view: ViewConfig, filterInfo: FilterInfo): ViewConfig {
  return applyViewUpdates(view, {
    filterInfo: {
      ...filterInfo,
      conditions: filterInfo.conditions.map((c) => ({ ...c }))
    }
  })
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
    sortInfo: newView.sortInfo ?? { ...DEFAULT_SORT_INFO },
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
      const fieldId = col?.fieldId ?? (col as any)?.id
      if (fieldId == null || fieldId === '') continue
      const idStr = String(fieldId)
      if (seenIds.has(idStr)) continue
      const field = tableFields.find((f) => f.id === fieldId)
      if (!field) continue
      seenIds.add(idStr)
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
    title: c.field_name_alias,
  }))
  return result
}
