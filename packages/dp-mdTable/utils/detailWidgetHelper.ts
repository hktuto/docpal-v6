/**
 * Detail View Widget Helper
 * 
 * Follows the same structure as dp-dashboard's dashboardWidgetHelper.ts
 * so widgets can be extended to dashboard later.
 */

// Widget component imports (lazy loaded)
import type { Component } from 'vue'

/**
 * Detail widget types for Phase 1
 * - TableInfo: Display selected fields from the current record
 * - RelatedTableList: Show related records for a relation field
 */
export type DetailWidgetType = 
  | 'TableInfo' 
  | 'RelatedTableList'

/**
 * Detail widget type categories
 */
export const enum DETAIL_WIDGET_TYPE {
  info = 'info',
  relations = 'relations',
  default = 'default'
}

/**
 * Widget setting interface - compatible with DashboardWidgetSetting
 */
export interface DetailWidgetSetting {
  /** Grid x position */
  x?: number
  /** Grid y position */
  y?: number
  /** Unique widget instance ID */
  i?: string
  /** Minimum width in grid columns */
  minW?: number
  /** Minimum height in grid rows */
  minH?: number
  /** Maximum width in grid columns */
  maxW?: number
  /** Maximum height in grid rows */
  maxH?: number
  /** Default width in grid columns */
  w: number
  /** Default height in grid rows */
  h: number
  /** Widget component name */
  component: DetailWidgetType
  /** Widget-specific settings */
  setting?: Record<string, any>
  /** Show divider line above widget */
  divided?: boolean
  /** i18n label key */
  label: string
  /** Widget type category */
  type?: DETAIL_WIDGET_TYPE
  /** Feature flag (optional) */
  feature?: string
}

/**
 * TableInfo widget settings
 */
export interface TableInfoWidgetSetting {
  /** Field names to display */
  fields: string[]
  /** Display layout: list (vertical) or grid (2 columns) */
  layout: 'list' | 'grid'
  /** Show field labels */
  showLabels: boolean
  /** Number of grid columns (for grid layout) */
  gridColumns?: number
}

/**
 * RelatedTableList widget settings
 */
export interface RelatedTableListWidgetSetting {
  /** Relation field name to show */
  relationFieldName: string
  /** Columns to display from related table */
  displayColumns: string[]
  /** Records per page */
  pageSize: number
  /** Show add button */
  allowAdd: boolean
  /** Show link to open related record */
  allowOpen: boolean
}

/**
 * Default widget settings registry
 */
export const detailWidgetSettings: Record<string, DetailWidgetSetting> = {
  TableInfo: {
    type: DETAIL_WIDGET_TYPE.info,
    label: 'detailWidget.tableInfo',
    minW: 4,
    minH: 2,
    maxW: 12,
    maxH: 12,
    w: 6,
    h: 4,
    component: 'TableInfo',
    setting: {
      fields: [],
      layout: 'grid',
      showLabels: true,
      gridColumns: 2
    } as TableInfoWidgetSetting
  },
  RelatedTableList: {
    type: DETAIL_WIDGET_TYPE.relations,
    label: 'detailWidget.relatedTableList',
    minW: 4,
    minH: 3,
    maxW: 12,
    maxH: 12,
    w: 12,
    h: 5,
    component: 'RelatedTableList',
    setting: {
      relationFieldName: '',
      displayColumns: [],
      pageSize: 5,
      allowAdd: true,
      allowOpen: true
    } as RelatedTableListWidgetSetting
  }
}

/**
 * Get widgets grouped by type
 */
export function getDetailWidgetsByType(
  settingMap: Record<string, DetailWidgetSetting>
): Record<string, DetailWidgetSetting[]> {
  const result: Record<string, DetailWidgetSetting[]> = {
    [DETAIL_WIDGET_TYPE.default]: []
  }

  Object.entries(settingMap).forEach(([key, item]) => {
    const widgetWithKey = { ...item, component: key as DetailWidgetType }
    
    if (item.type) {
      if (!result[item.type]) {
        result[item.type] = []
      }
      result[item.type].push(widgetWithKey)
    } else {
      result[DETAIL_WIDGET_TYPE.default].push(widgetWithKey)
    }
  })

  return result
}

/**
 * Get default widget setting by type
 */
export function getWidgetSetting(widget: DetailWidgetType): DetailWidgetSetting | undefined {
  return detailWidgetSettings[widget]
}

/**
 * Get normalized size constraints for a widget
 */
export function getNormalizedWidgetSetting(widget: DetailWidgetType): {
  minW: number
  minH: number
  maxW: number
  maxH: number
} {
  const item = getWidgetSetting(widget)
  if (!item) {
    return { minW: 2, minH: 2, maxW: 12, maxH: 6 }
  }
  return {
    minW: item.minW || 2,
    minH: item.minH || 2,
    maxW: item.maxW || 12,
    maxH: item.maxH || 6
  }
}

/**
 * Create a new widget instance with unique ID
 */
export function createWidgetInstance(
  widgetType: DetailWidgetType,
  position?: { x: number; y: number }
): DetailWidgetSetting {
  const template = getWidgetSetting(widgetType)
  if (!template) {
    throw new Error(`Unknown widget type: ${widgetType}`)
  }

  return {
    ...template,
    i: `${widgetType}_${Date.now()}`,
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    setting: { ...template.setting }
  }
}

/**
 * Generate default detail view layout for a table
 * Creates a TableInfo widget and RelatedTableList widgets for each relation
 */
export function generateDefaultDetailLayout(
  fields: Array<{ fieldName: string; type: number; relationTableId?: string }>,
  options?: {
    /** Include TableInfo widget */
    includeTableInfo?: boolean
    /** Include RelatedTableList widgets */
    includeRelations?: boolean
  }
): DetailWidgetSetting[] {
  const layout: DetailWidgetSetting[] = []
  const { includeTableInfo = true, includeRelations = true } = options || {}

  let currentY = 0

  // Add TableInfo widget with non-relation fields
  if (includeTableInfo) {
    const nonRelationFields = fields
      .filter(f => f.type !== 14 && f.type !== 15) // Exclude MagicLink and VirtualColumn
      .map(f => f.fieldName)

    const tableInfoWidget = createWidgetInstance('TableInfo', { x: 0, y: currentY })
    tableInfoWidget.setting = {
      ...tableInfoWidget.setting,
      fields: nonRelationFields.slice(0, 10) // Limit to first 10 fields
    }
    layout.push(tableInfoWidget)
    currentY += tableInfoWidget.h
  }

  // Add RelatedTableList widget for each relation field
  if (includeRelations) {
    const relationFields = fields.filter(f => f.type === 14) // MagicLink only

    relationFields.forEach((field, index) => {
      const relWidget = createWidgetInstance('RelatedTableList', { 
        x: 0, 
        y: currentY 
      })
      relWidget.setting = {
        ...relWidget.setting,
        relationFieldName: field.fieldName
      }
      layout.push(relWidget)
      currentY += relWidget.h
    })
  }

  return layout
}
