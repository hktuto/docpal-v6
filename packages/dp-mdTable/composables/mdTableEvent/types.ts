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

export interface GridEventCallbacks {
  onCellClick: (params: any) => void
  onCellMouseenter: (params: any) => void
  onCellMouseleave: (params: any) => void
  onStartEdit: (params: any) => void
  onExitEdit: (params: any) => void
  onRefresh: () => void | Promise<void>
}

export interface UseGridEventsOptions {
  gridRef: Ref<any>
  columns: Ref<any[]>
  updateRow: (rowId: string, data: any, mdTableId?: string) => Promise<boolean>
  syncRowAndGroupAncestors: (rowId: string, options?: { gridRef: Ref<any> }) => Promise<void>
  getAgg: () => Promise<void>
  isGroupingEnabled: Ref<boolean>
  updateExpandedRows: () => void
  saveColumnOrder: (oldColumnId: string, newColumnId: string, dragPos: 'left' | 'right') => void
  rightClickCellPopoverRef: Ref<any>
  callbacks: GridEventCallbacks
}
