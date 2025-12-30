// src/components/AdvancedGrid/utils/export.ts
import * as XLSX from 'xlsx'

export async function exportExcel(
  grid: any,
  filename: string = 'export.xlsx'
) {
  const tableData = grid.getTableData().tableData
  
  // 获取列配置
  const columns = grid.getColumns()
    .filter(col => col.type !== 'checkbox' && col.type !== 'radio')
    .map(col => ({
      field: col.field,
      title: col.title
    }))

  // 准备数据
  const data = [
    columns.map(col => col.title),
    ...tableData.map(row => 
      columns.map(col => row[col.field])
    )
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 设置列宽
  const colWidths = columns.map(col => ({
    wch: Math.max(
      col.title.length,
      ...tableData.map(row => 
        String(row[col.field] || '').length
      )
    )
  }))
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, filename)
}

export function exportCSV(grid: VxeGridInstance, filename: string = 'export.csv') {
  const tableData = grid.getTableData().tableData
  const columns = grid.getColumns()
    .filter(col => col.type !== 'checkbox' && col.type !== 'radio')
    .map(col => col.title)
  
  const csvContent = [
    columns.join(','),
    ...tableData.map(row => 
      columns.map(col => 
        `"${String(row[col] || '').replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
