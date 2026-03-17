// types/column-context.ts
import type { InjectionKey, Ref } from 'vue'
import type { ColumnFieldType } from './column-types'
import type { VxeTableDefines } from 'vxe-table'

export type OrdersParam = {
    newColumn: VxeTableDefines.ColumnInfo
    oldColumn: VxeTableDefines.ColumnInfo
    dragPos: 'left' | 'right'
}

export interface QueryRelatedTableOptions {
    keyword?: string
    searchFields?: string[]
    pageNum?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface QueryRelatedTableResult {
    rows: any[]
    total: number
    pageNum: number
    pageSize: number
}

export interface ColumnConfig {
    id?: string
    field_name: string
    business_type: ColumnFieldType
    display_structure?: Record<string, any>
    /** 统计方法 */
    [key: string]: any
}

export interface ColumnContext {
    getColumn: (field: string) => ColumnConfig | undefined
    getAllColumns: () => Promise<ColumnConfig[]>
    addColumn: (column: ColumnConfig, targetColumnName?: string, position?: 'left' | 'right') => Promise<void>
    deleteColumn: (field: string) => Promise<void>
    updateColumn: (field: string, updates: Partial<ColumnConfig>) => Promise<void>
    saveColumnOrder: (ordersParam: OrdersParam) => void
    columns: Ref<ColumnConfig[]>
    addColumnPopoverRef: Ref<any>
    // Relation helpers
    getAvailableTablesForRelation?: (excludeCurrentTable?: boolean) => Promise<any[]>
    getFieldsForTable?: (tableId: string) => Promise<any[]>
    getExistingRelationToTable?: (targetTableId: string) => Promise<any | null>
    getRelationFields?: () => any[]
    addVirtualColumn?: (relationFieldName: string, displayFieldName: string, position?: { targetColumn: string; side: 'left' | 'right' }) => Promise<void>
    tableId?: Ref<string>
    entityId?: Ref<string>
    // Record card preview helpers
    getTableCardConfig?: (tableId: string) => Promise<any | null>
    getRecordById?: (tableId: string, recordId: string) => Promise<Record<string, any> | null>
    // Query related table data for relation field editing
    queryRelatedTable?: (tableId: string, options?: QueryRelatedTableOptions) => Promise<QueryRelatedTableResult>
}

export const ColumnContextKey: InjectionKey<ColumnContext> = Symbol('ColumnInject')

export interface UseColumnsOptions {
    onColumnAdd?: (column: ColumnConfig) => void
    onColumnDelete?: (field: string) => void
    onColumnUpdate?: (field: string, column: ColumnConfig) => void
}
