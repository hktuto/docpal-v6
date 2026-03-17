import * as XLSX from 'xlsx'

export interface ExcelSheet {
  name: string
  columns: { field: string; title: string }[]
  data: any[]
  footerData?: any[]
}

export interface ExcelExportOptions {
  sheets: ExcelSheet[]
  fileName: string
}

/**
 * Export data to Excel file with multiple sheets
 */
export function exportToExcel(options: ExcelExportOptions): void {
  const workbook = XLSX.utils.book_new()

  options.sheets.forEach((sheet) => {
    // Prepare headers
    const headers = sheet.columns.map((col) => col.title)

    // Prepare data rows
    const dataRows = sheet.data.map((row) => {
      return sheet.columns.map((col) => {
        const value = row[col.field]
        // Handle HTML content - strip tags
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
    })

    // Add footer if provided
    if (sheet.footerData && sheet.footerData.length > 0) {
      const footerRows = sheet.footerData.map((row) => {
        return sheet.columns.map((col) => {
          const value = row[col.field]
          if (typeof value === 'string' && value.includes('<')) {
            return stripHtml(value)
          }
          return value ?? ''
        })
      })
      dataRows.push(...footerRows)
    }

    // Combine headers and data
    const worksheetData = [headers, ...dataRows]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths (auto-width based on header length)
    const colWidths = sheet.columns.map((col) => ({
      wch: Math.max(col.title.length + 2, 12)
    }))
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  // Generate file name with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFileName = `${options.fileName}_${timestamp}.xlsx`

  // Write file
  XLSX.writeFile(workbook, fullFileName)
}

/**
 * Export single sheet to Excel
 */
export function exportSingleSheet(
  columns: { field: string; title: string }[],
  data: any[],
  fileName: string,
  footerData?: any[]
): void {
  exportToExcel({
    sheets: [
      {
        name: 'Report',
        columns,
        data,
        footerData
      }
    ],
    fileName
  })
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * Format date for export
 */
export function formatDate(date: string | Date, format = 'DD/MM/YYYY'): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
}

/**
 * Get export file name with report code
 */
export function getExportFileName(reportCode: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${reportCode}_${timestamp}`
}
