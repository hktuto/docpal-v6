

export type DatabaseItem = {
  [key: string]: any
}


export type DatabaseMenuRouteParams = {
  detailId: string | null
  pageType: 'setting' | 'detail'
  detailType: 'folder' | 'master_table' | 'view' | 'dashboard' | 'root' | 'record'
  /** For record detail view: the record ID being viewed */
  recordId?: string | null
  /** For record detail view: the table ID the record belongs to */
  tableId?: string | null
  /** For master_table detail view: the item ID of the master table */
  item_id?: string | null
}
