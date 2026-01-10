import type {TableDataContext,  ColumnContext, } from '#imports'
import { TableDataContextKey, ColumnContextKey } from '#imports'

export const useTableView = () => {

  ///Region Table Data Logic
  const tableId = ref<string>('')
  const dataTableId = ref<string>('')
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const {query} = usePglite()
  const tableData = ref<any[]>([])

  const queryParams = ref<any>({})

  async function getTableData(){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    // TODO : add params t oquery
    console.log('getTableData', queryParams.value)
    const data = await query(`SELECT * FROM ${tableId.value}`)
    tableData.value = data
    console.log('tableData', tableData.value)
    return data
  }

  async function refresh(){
    await getTableData()
  }

  async function addRow(row:any){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    const data = await query(`INSERT INTO ${tableId.value} VALUES (${row})`)
    tableData.value.push(data)
  }

  async function updateRow(row:any){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    if(!row.id){
      throw new Error('row id is required')
    }
    const data = await query(`UPDATE ${tableId.value} SET ${row} WHERE id = ${row.id}`)
    const index = tableData.value.findIndex(item => item.id === row.id)
    if(index !== -1){
      tableData.value[index] = data
    }
  }

  async function deleteRow(id:number){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    if(!id){
      throw new Error('row id is required')
    }
    const data = await query(`DELETE FROM ${tableId.value} WHERE id = ${id}`)
    tableData.value = tableData.value.filter(item => item.id !== id)
  }

  provide(TableDataContextKey, {
    tableData,
    loading,
    error,
    queryParams,
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow,
  })
  ///End Region Table Data Logic

  ///Region Column Data Logic
  const columns = ref<ColumnConfig[]>([])
  const columnGroupRules = ref<any[]>([])

  function getColumn(field:string):ColumnConfig | undefined{
    return columns.value.find(item => item.field === field)
  }

  async function getAllColumns(): Promise<ColumnConfig[]>{
    if(!dataTableId.value){
      throw new Error('tableId is required')
    }
    const data = await query<ColumnConfig>(`SELECT * FROM data_table_columns WHERE data_table_id = $1`, [dataTableId.value])

    columns.value = data.map((item) => {
      return {
        ...item,
        minWidth: 120
      }
    })
    // console.log('getAllColumns', columns.value)
    return data
  }

  async function addColumn(column: ColumnConfig){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    if(!column){
      throw new Error('column is required')
    }
    if(!column.field || !column.title){
      throw new Error('field and title are required')
    }
    const data = await query('INSERT INTO data_table_columns VALUES ($1)', [column])
    console.log('addColumn', data)
    columns.value.push(column)
  }

  async function updateColumn(field: string, updates: Partial<ColumnConfig>){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    if(!field){
      throw new Error('field is required')
    }
    const column = getColumn(field)
    const newData = {
      ...column,
      ...updates
    }
    const result = await query('UPDATE data_table_columns SET $1 WHERE id = $2', [newData, column.id])
    
  }

  async function deleteColumn(field: string){
    if(!tableId.value){
      throw new Error('tableId is required')
    }
    if(!field){
      throw new Error('field is required')
    }
    const result = await query('DELETE FROM data_table_columns WHERE data_table_id = $1 AND field = $2', [tableId.value, field])
    if(result){
      columns.value = columns.value.filter(item => item.field !== field)

    }
  }

  provide(ColumnContextKey, {
    getColumn,
    getAllColumns,
    addColumn,
    deleteColumn,
    updateColumn,
    columns,
    columnGroupRules,
  })

  return {
    dataTableId,
    tableId,
    loading,
    error,
    tableData,
    queryParams,
    getTableData,
    refresh,
    addRow,
    updateRow,
    deleteRow,
    columns,
    columnGroupRules,
    getColumn,
    getAllColumns,
    addColumn,
    updateColumn,
    deleteColumn,
  }
}
