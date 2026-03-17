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

export interface ReportHeader {
  reportId: string
  compiledBy: string
  project: string
  inputProject?: string
  inputFrom?: string
  inputTo?: string
  inputIncluded?: string
  stage?: string
  title: string
  subtitle: string
  dateRange: string
  remark?: string
  totalLabel?: string
  totalValue?: number
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
 * Export SCS-101 report with headers and multiple sheets
 */
export function exportSCS101ToExcel(
  header: ReportHeader,
  tables: { name: string; columns: { field: string; title: string }[]; data: any[] }[]
): void {
  const workbook = XLSX.utils.book_new()
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  tables.forEach((table) => {
    // Build header rows
    const headerRows: any[][] = [
      [`REPORT ID: ${header.reportId}`, '', '', '', '', '', '', '', '', '', '', `PAGE: 1`],
      [`COMPILED BY: ${header.compiledBy}`, '', '', '', '', '', '', '', '', '', '', `DATE: ${pageDate}`],
      [`PROJECT: ${header.project}`, '', '', '', '', '', '', '', '', '', '', ''],
      [''],
    ]

    // Add input filters
    if (header.inputProject !== undefined) {
      headerRows.push([`Input Project: ${header.inputProject || 'NULL'}`])
    }
    if (header.inputFrom !== undefined) {
      headerRows.push([`Input From: ${header.inputFrom || 'NULL'}`])
    }
    if (header.inputTo !== undefined) {
      headerRows.push([`Input To: ${header.inputTo || 'NULL'}`])
    }

    // Add blank row before title
    headerRows.push([''])

    // Add title section
    const titleRow = ['', '', '', '', header.title]
    headerRows.push(titleRow)
    headerRows.push(['', '', '', '', header.subtitle])
    headerRows.push(['', '', '', '', header.dateRange])
    headerRows.push([''])

    // Prepare column headers
    const colHeaders = table.columns.map((col) => col.title)
    headerRows.push(colHeaders)

    // Prepare data rows
    const dataRows = table.data.map((row) => {
      return table.columns.map((col) => {
        const value = row[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
    })

    // Add end of report marker
    dataRows.push([''])
    dataRows.push(['', '', '', '', '', '*** END OF REPORT ***'])

    // Combine all rows
    const worksheetData = [...headerRows, ...dataRows]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = table.columns.map((col) => ({
      wch: Math.max(col.title.length + 2, 15)
    }))
    if (colWidths.length > 0) {
      colWidths[0].wch = 30
    }
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook with table name as sheet name
    const sheetName = table.name.replace(/[\\/*?:\[\]]/g, '').substring(0, 31)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  // Write file
  const fullFileName = `${header.reportId}_${timestamp}.xlsx`
  XLSX.writeFile(workbook, fullFileName)
}

/**
 * Export report with headers to Excel
 */
export function exportReportToExcel(
  header: ReportHeader,
  columns: { field: string; title: string }[],
  data: any[],
  footerData?: any[]
): void {
  const workbook = XLSX.utils.book_new()
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  // Build header rows
  const headerRows: any[][] = [
    [`REPORT ID: ${header.reportId}`, '', '', '', '', '', '', '', '', '', '', `PAGE: 1`],
    [`COMPILED BY: ${header.compiledBy}`, '', '', '', '', '', '', '', '', '', '', `DATE: ${pageDate}`],
    [`PROJECT: ${header.project}`, '', '', '', '', '', '', '', '', '', '', ''],
    [''],
  ]

  // Add input filters
  if (header.inputProject !== undefined) {
    headerRows.push([`Input Project: ${header.inputProject || 'NULL'}`])
  }
  if (header.inputFrom !== undefined) {
    headerRows.push([`Input From: ${header.inputFrom || 'NULL'}`])
  }
  if (header.inputTo !== undefined) {
    headerRows.push([`Input To: ${header.inputTo || 'NULL'}`])
  }
  if (header.inputIncluded !== undefined) {
    headerRows.push([`Input Included: ${header.inputIncluded || '-'}`])
  }
  if (header.stage !== undefined) {
    headerRows.push([`Stage: ${header.stage}`])
  }

  // Add blank row before title
  headerRows.push([''])

  // Add title section (centered by merging concept - we'll add empty cells for alignment)
  const titleRow = ['', '', '', '', header.title]
  headerRows.push(titleRow)
  headerRows.push(['', '', '', '', header.subtitle])
  headerRows.push(['', '', '', '', header.dateRange])
  headerRows.push([''])

  // Add remark if present (for SCS-102)
  if (header.remark) {
    headerRows.push([header.remark])
    headerRows.push([''])
  }

  // Prepare column headers
  const colHeaders = columns.map((col) => col.title)
  headerRows.push(colHeaders)

  // Prepare data rows
  const dataRows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value ?? ''
    })
  })

  // Add footer data
  if (footerData && footerData.length > 0) {
    footerData.forEach((footerRow) => {
      const row = columns.map((col) => {
        const value = footerRow[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
      dataRows.push(row)
    })
  }

  // Add total row if specified (for SCS-102)
  if (header.totalLabel && header.totalValue !== undefined) {
    const totalRow = new Array(columns.length).fill('')
    totalRow[0] = header.totalLabel
    totalRow[1] = header.totalValue
    dataRows.push(totalRow)
  }

  // Add end of report marker
  dataRows.push([''])
  dataRows.push(['', '', '', '', '', '*** END OF REPORT ***'])

  // Combine all rows
  const worksheetData = [...headerRows, ...dataRows]

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.title.length + 2, 15)
  }))
  // Make first column wider for headers
  if (colWidths.length > 0) {
    colWidths[0].wch = 30
  }
  worksheet['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  // Write file
  const fullFileName = `${header.reportId}_${timestamp}.xlsx`
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
 * Format date for report header (DD/MM/YYYY)
 */
function formatDateForReport(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Get export file name with report code
 */
export function getExportFileName(reportCode: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `${reportCode}_${timestamp}`
}
