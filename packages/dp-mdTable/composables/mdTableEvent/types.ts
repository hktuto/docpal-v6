import type { Ref } from 'vue'

export interface RelationCellClickParams {
  targetTableId: string
  recordId: string
  title?: string
  relationField?: string
  displayValue?: Record<string, any>
  row?: Record<string, any>
  column?: Record<string, any>
}

export interface RowContextMenuEventParams {
  event: MouseEvent
  row: any
  rowIndex?: number
  column?: any
}

export interface GridEventCallbacks {
  onCellClick: (params: any) => void
  onCellMouseenter: (params: any) => void
  onCellMouseleave: (params: any) => void
  onRowDblclick: (params: any) => void
  onRowContextMenu: (params: RowContextMenuEventParams) => void
  onStartEdit: (params: any) => void
  onExitEdit: (params: any) => void
  onRefresh: () => void | Promise<void>
  onColumnResize: (params: any) => void  | Promise<void>
}

export interface UseGridEventsOptions {
  gridRef: Ref<any>
  columns: Ref<any[]>
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  syncRowAndGroupAncestors: (rowId: string, options?: { gridRef: Ref<any> }) => Promise<void>
  getAgg: () => Promise<void>
  isGroupingEnabled: Ref<boolean>
  updateExpandedRows: () => void
  updateColumn: (fielsName: string, newValue:any) => void
  saveColumnOrder: (oldColumnId: string, newColumnId: string, dragPos: 'left' | 'right') => void
  callbacks: GridEventCallbacks
}
