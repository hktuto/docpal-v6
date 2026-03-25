import Excel from 'exceljs'

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
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const workbook = new Excel.Workbook()
  const timestamp = new Date().toISOString().split('T')[0]

  options.sheets.forEach((sheet) => {
    // Create worksheet
    const worksheet = workbook.addWorksheet(sheet.name)

    // Add headers
    const headers = sheet.columns.map((col) => col.title)
    worksheet.addRow(headers)

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add data rows
    sheet.data.forEach((row) => {
      const rowData = sheet.columns.map((col) => {
        const value = row[col.field]
        // Handle HTML content - strip tags
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
      worksheet.addRow(rowData)
    })

    // Add footer if provided
    if (sheet.footerData && sheet.footerData.length > 0) {
      sheet.footerData.forEach((footerRow) => {
        const rowData = sheet.columns.map((col) => {
          const value = footerRow[col.field]
          if (typeof value === 'string' && value.includes('<')) {
            return stripHtml(value)
          }
          return value ?? ''
        })
        const row = worksheet.addRow(rowData)
        row.font = { bold: true }
      })
    }

    // Set column widths
    sheet.columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = Math.max(col.title.length + 2, 12)
    })

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', ySplit: 1 }
    ]
  })

  // Generate file name with timestamp
  const fullFileName = `${options.fileName}_${timestamp}.xlsx`

  // Download the file
  await downloadWorkbook(workbook, fullFileName)
}

/**
 * Export SCS-101 report with headers and multiple sheets
 */
export async function exportSCS101ToExcel(
  header: ReportHeader,
  tables: { name: string; columns: { field: string; title: string }[]; data: any[] }[]
): Promise<void> {
  const workbook = new Excel.Workbook()
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  tables.forEach((table) => {
    // Create worksheet with sanitized sheet name
    const sheetName = table.name.replace(/[\\/*?:\[\]]/g, '').substring(0, 31)
    const worksheet = workbook.addWorksheet(sheetName)

    let currentRow = 1

    // Title section: fixed 3 rows (rows 3-5)
    const titleStartCol = 3  // Column C
    const titleEndCol = 9    // Column I
    const titleStartRow = 3  // Row 3
    const titleEndRow = 5    // Row 5 (3 rows total)

    // Row 1: REPORT ID and PAGE
    worksheet.addRow([`REPORT ID: ${header.reportId}`, '', '', '', '', '', '', '', '', '', '', `PAGE: 1`])
    currentRow++

    // Row 2: COMPILED BY and DATE
    worksheet.addRow([`COMPILED BY: ${header.compiledBy}`, '', '', '', '', '', '', '', '', '', '', `DATE: ${pageDate}`])
    currentRow++

    // Row 3-5: Create merged cell for title section (C3:I5)
    worksheet.mergeCells(titleStartRow, titleStartCol, titleEndRow, titleEndCol)
    const titleCell = worksheet.getCell(titleStartRow, titleStartCol)

    // Build text with line breaks for title section
    const titleText = `${header.title}\n${header.subtitle}\n${header.dateRange}`
    titleCell.value = titleText
    titleCell.font = { bold: true, size: 14 }
    // Use 'middle' for vertical alignment in merged cell
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

    // Remove borders from the merged title cell
    titleCell.border = {
      top: { style: 'none' },
      left: { style: 'none' },
      bottom: { style: 'none' },
      right: { style: 'none' }
    }

    // Row 3: PROJECT (left side)
    const row3 = worksheet.getRow(3)
    row3.getCell(1).value = `PROJECT: ${header.project}`
    currentRow = 3

    // Row 4: blank (left side), input filters continue below
    worksheet.addRow([''])
    currentRow = 5

    // Row 6+: Input filters on the left side
    if (header.inputProject !== undefined) {
      worksheet.addRow([`Input Project: ${header.inputProject || 'NULL'}`])
      currentRow++
    }
    if (header.inputFrom !== undefined) {
      worksheet.addRow([`Input From: ${header.inputFrom || 'NULL'}`])
      currentRow++
    }
    if (header.inputTo !== undefined) {
      worksheet.addRow([`Input To: ${header.inputTo || 'NULL'}`])
      currentRow++
    }

    // Add column headers
    const colHeaders = table.columns.map((col) => col.title)
    worksheet.addRow(colHeaders)
    const headerRowNumber = currentRow
    const headerRow = worksheet.getRow(headerRowNumber)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    currentRow++

    // Add data rows
    table.data.forEach((row) => {
      const rowData = table.columns.map((col) => {
        const value = row[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
      worksheet.addRow(rowData)
    })

    // Add end of report marker
    worksheet.addRow([''])
    worksheet.addRow(['', '', '', '', '', '*** END OF REPORT ***'])

    // Set column widths
    table.columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = Math.max(col.title.length + 2, 15)
    })
    if (table.columns.length > 0) {
      worksheet.getColumn(1).width = 30
    }

    // Freeze the column header row
    worksheet.views = [
      { state: 'frozen', ySplit: headerRowNumber }
    ]
  })

  // Download the file
  const fullFileName = `${header.reportId}_${timestamp}.xlsx`
  await downloadWorkbook(workbook, fullFileName)
}

/**
 * Export report with headers to Excel
 */
export async function exportReportToExcel(
  header: ReportHeader,
  columns: { field: string; title: string }[],
  data: any[],
  footerData?: any[]
): Promise<void> {
  const workbook = new Excel.Workbook()
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  const worksheet = workbook.addWorksheet('Report')

  let currentRow = 1

  // Title section: fixed 3 rows (rows 3-5)
  const titleStartCol = 3  // Column C
  const titleEndCol = 9    // Column I
  const titleStartRow = 3  // Row 3
  const titleEndRow = 5    // Row 5 (3 rows total)

  // Row 1: REPORT ID and PAGE
  worksheet.addRow([`REPORT ID: ${header.reportId}`, '', '', '', '', '', '', '', '', '', '', `PAGE: 1`])
  currentRow++

  // Row 2: COMPILED BY and DATE
  worksheet.addRow([`COMPILED BY: ${header.compiledBy}`, '', '', '', '', '', '', '', '', '', '', `DATE: ${pageDate}`])
  currentRow++

  // Row 3-5: Create merged cell for title section (C3:I5)
  worksheet.mergeCells(titleStartRow, titleStartCol, titleEndRow, titleEndCol)
  const titleCell = worksheet.getCell(titleStartRow, titleStartCol)

  // Build text with line breaks for title section (no extra lines)
  const titleText = `${header.title}\n${header.subtitle}\n${header.dateRange}`
  titleCell.value = titleText
  titleCell.font = { bold: true, size: 14 }
  // Use 'middle' for vertical alignment in merged cell
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

  // Remove borders from the merged title cell
  titleCell.border = {
    top: { style: 'none' },
    left: { style: 'none' },
    bottom: { style: 'none' },
    right: { style: 'none' }
  }

  // Row 3: PROJECT (left side)
  const row3 = worksheet.getRow(3)
  row3.getCell(1).value = `PROJECT: ${header.project}`
  currentRow = 3

  // Row 4-5: blank (left side), input filters continue below
  worksheet.addRow([''])
  worksheet.addRow([''])
  currentRow = 5

  // Row 6+: Input filters on the left side
  if (header.inputProject !== undefined) {
    worksheet.addRow([`Input Project: ${header.inputProject || 'NULL'}`])
    currentRow++
  }
  if (header.inputFrom !== undefined) {
    worksheet.addRow([`Input From: ${header.inputFrom || 'NULL'}`])
    currentRow++
  }
  if (header.inputTo !== undefined) {
    worksheet.addRow([`Input To: ${header.inputTo || 'NULL'}`])
    currentRow++
  }
  if (header.inputIncluded !== undefined) {
    worksheet.addRow([`Input Included: ${header.inputIncluded || '-'}`])
    currentRow++
  }
  if (header.stage !== undefined) {
    worksheet.addRow([`Stage: ${header.stage}`])
    currentRow++
  }

  // Add remark if present (for SCS-102)
  if (header.remark) {
    worksheet.addRow([header.remark])
    worksheet.addRow([''])
    currentRow += 2
  }

  // Add column headers
  const colHeaders = columns.map((col) => col.title)
  worksheet.addRow(colHeaders)
  const headerRowNumber = currentRow
  const headerRow = worksheet.getRow(headerRowNumber)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  currentRow++

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value ?? ''
    })
    worksheet.addRow(rowData)
  })

  // Add footer data
  if (footerData && footerData.length > 0) {
    footerData.forEach((footerRow) => {
      const rowData = columns.map((col) => {
        const value = footerRow[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value ?? ''
      })
      const row = worksheet.addRow(rowData)
      row.font = { bold: true }
    })
  }

  // Add total row if specified (for SCS-102)
  if (header.totalLabel && header.totalValue !== undefined) {
    const totalRow = new Array(columns.length).fill('')
    totalRow[0] = header.totalLabel
    totalRow[1] = header.totalValue
    const row = worksheet.addRow(totalRow)
    row.font = { bold: true }
  }

  // Add end of report marker
  worksheet.addRow([''])
  worksheet.addRow(['', '', '', '', '', '*** END OF REPORT ***'])

  // Set column widths
  columns.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = Math.max(col.title.length + 2, 15)
  })
  // Make first column wider for headers
  if (columns.length > 0) {
    worksheet.getColumn(1).width = 30
  }

  // Freeze the column header row
  worksheet.views = [
    { state: 'frozen', ySplit: headerRowNumber }
  ]

  // Download the file
  const fullFileName = `${header.reportId}_${timestamp}.xlsx`
  await downloadWorkbook(workbook, fullFileName)
}

/**
 * Helper function to download workbook
 */
async function downloadWorkbook(workbook: Excel.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export single sheet to Excel
 */
export async function exportSingleSheet(
  columns: { field: string; title: string }[],
  data: any[],
  fileName: string,
  footerData?: any[]
): Promise<void> {
  await exportToExcel({
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

/**
 * Export SCS-103 report with main table and summary table
 */
export async function exportSCS103ToExcel(
  header: ReportHeader,
  mainColumns: { field: string; title: string }[],
  mainData: any[],
  summaryColumns: { field: string; title: string }[],
  summaryData: any[]
): Promise<void> {
  const workbook = new Excel.Workbook()
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  const worksheet = workbook.addWorksheet('Report')

  let currentRow = 1

  // Title section: fixed 3 rows (rows 3-5)
  const titleStartCol = 3
  const titleEndCol = 9
  const titleStartRow = 3
  const titleEndRow = 5

  // Row 1: REPORT ID and PAGE
  worksheet.addRow([`REPORT ID: ${header.reportId}`, '', '', '', '', '', '', '', '', '', '', `PAGE: 1`])
  currentRow++

  // Row 2: COMPILED BY and DATE
  worksheet.addRow([`COMPILED BY: ${header.compiledBy}`, '', '', '', '', '', '', '', '', '', '', `DATE: ${pageDate}`])
  currentRow++

  // Row 3-5: Create merged cell for title section (C3:I5)
  worksheet.mergeCells(titleStartRow, titleStartCol, titleEndRow, titleEndCol)
  const titleCell = worksheet.getCell(titleStartRow, titleStartCol)

  const titleText = `${header.title}\n${header.subtitle}\n${header.dateRange}`
  titleCell.value = titleText
  titleCell.font = { bold: true, size: 14 }
  // Use 'middle' for vertical alignment in merged cell
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  titleCell.border = {
    top: { style: 'none' },
    left: { style: 'none' },
    bottom: { style: 'none' },
    right: { style: 'none' }
  }

  // Row 3: PROJECT (left side)
  const row3 = worksheet.getRow(3)
  row3.getCell(1).value = `PROJECT: ${header.project}`
  currentRow = 3

  // Row 4-5: blank (left side), input filters continue below
  worksheet.addRow([''])
  worksheet.addRow([''])
  currentRow = 5

  // Row 6+: Input filters on the left side
  if (header.inputProject !== undefined) {
    worksheet.addRow([`Input Project: ${header.inputProject || 'NULL'}`])
    currentRow++
  }
  if (header.inputFrom !== undefined) {
    worksheet.addRow([`Input From: ${header.inputFrom || 'NULL'}`])
    currentRow++
  }
  if (header.inputTo !== undefined) {
    worksheet.addRow([`Input To: ${header.inputTo || 'NULL'}`])
    currentRow++
  }
  if (header.stage !== undefined) {
    worksheet.addRow([`Stage: ${header.stage}`])
    currentRow++
  }

  // Add spacing before main table
  worksheet.addRow([''])
  currentRow++

  // Add main table
  const mainColHeaders = mainColumns.map((col) => col.title)
  worksheet.addRow(mainColHeaders)
  const mainHeaderRowNumber = currentRow
  const mainHeaderRow = worksheet.getRow(mainHeaderRowNumber)
  mainHeaderRow.font = { bold: true }
  mainHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  currentRow++

  // Add main table data
  mainData.forEach((row) => {
    const rowData = mainColumns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value ?? ''
    })
    worksheet.addRow(rowData)
    currentRow++
  })

  // Add spacing before summary table
  worksheet.addRow([''])
  worksheet.addRow([''])
  currentRow += 2

  // Add summary table title
  const summaryTitleRow = worksheet.addRow(['Summary'])
  summaryTitleRow.font = { bold: true, size: 12 }
  currentRow++

  // Add summary table
  const summaryColHeaders = summaryColumns.map((col) => col.title)
  worksheet.addRow(summaryColHeaders)
  const summaryHeaderRowNumber = currentRow
  const summaryHeaderRow = worksheet.getRow(summaryHeaderRowNumber)
  summaryHeaderRow.font = { bold: true }
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  currentRow++

  // Add summary table data
  summaryData.forEach((row) => {
    const rowData = summaryColumns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value ?? ''
    })
    worksheet.addRow(rowData)
    currentRow++
  })

  // Set column widths for main table
  mainColumns.forEach((col, index) => {
    worksheet.getColumn(index + 1).width = Math.max(col.title.length + 2, 15)
  })
  if (mainColumns.length > 0) {
    worksheet.getColumn(1).width = 30
  }

  // Freeze the main table header row
  worksheet.views = [
    { state: 'frozen', ySplit: mainHeaderRowNumber }
  ]

  // Download the file
  const fullFileName = `${header.reportId}_${timestamp}.xlsx`
  await downloadWorkbook(workbook, fullFileName)
}

/**
 * Read example Excel file (for testing purposes)
 */
export async function readExampleExcel(file: ArrayBuffer) {
  const workbook = new Excel.Workbook()
  await workbook.xlsx.load(file)
  console.log(workbook)
  const buffer = await workbook.xlsx.writeBuffer()
  // convert buffer to a file and download it
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'report.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
