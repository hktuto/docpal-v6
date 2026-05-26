export interface GanttRow {
  id: string
  [key: string]: any
}

export interface GanttColumn {
  field: string
  title: string
  width: number
  visible: boolean
}

export interface GanttTask {
  id: string
  rowId: string
  label: string
  start: Date | null
  end: Date | null
  raw: GanttRow
}

export type DateViewType = 'day' | 'week' | 'quarter'

export interface GanttViewConfig {
  startField: string
  endField: string
  barLabelField?: string
  dateView: DateViewType
  visibleColumns: string[]
  columnWidths: Record<string, number>
}

export interface GanttViewport {
  // Vertical
  scrollTop: number
  visibleStartIndex: number
  visibleEndIndex: number
  offsetY: number
  // Horizontal (timeline only)
  scrollLeft: number
  // Dimensions
  containerWidth: number
  containerHeight: number
  contentHeight: number
}

export interface GanttStageConfig {
  rowHeight: number
  headerHeight: number
  tableWidth: number
  splitterWidth: number
  minTableWidth: number
  maxTableWidth: number
  timelineColumnWidth: {
    day: number
    week: number
    quarter: number
  }
}

export const DEFAULT_STAGE_CONFIG: GanttStageConfig = {
  rowHeight: 40,
  headerHeight: 36,
  tableWidth: 300,
  splitterWidth: 4,
  minTableWidth: 150,
  maxTableWidth: 600,
  timelineColumnWidth: {
    day: 60,
    week: 120,
    quarter: 200
  }
}
