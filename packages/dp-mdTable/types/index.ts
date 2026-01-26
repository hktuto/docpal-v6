// src/types/vxe-grid.d.ts
import type { VxeGridProps, VxeGridListeners } from 'vxe-table'

// Re-export view config types
export * from './view-config'

export interface GridColumn {
  field: string
  title: string
  width?: number
  minWidth?: number
  visible?: boolean
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  editRender?: any
  slots?: Record<string, string>
  [key: string]: any
}

export interface GridProps extends Partial<VxeGridProps> {
  showToolbar?: boolean
  showSearch?: boolean
  showRefresh?: boolean
  showExport?: boolean
  showColumnConfig?: boolean
  groupBy?: string[]
  height?: string | number
}

export interface GridEvents extends VxeGridListeners {
  onRefresh?: () => void
  onSearch?: (value: string) => void
  onExport?: () => void
}
