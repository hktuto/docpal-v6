import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import autoTable from 'jspdf-autotable'

export async function divToPDF(divId: string, name: string) {
  const contentDiv: HTMLElement | null = document.getElementById(divId)
  if (!contentDiv) {
    throw new Error('Content element not found')
  }
  const originalOverflow = contentDiv.style.overflow
  contentDiv.style.height = 'auto'
  contentDiv.style.overflow = 'visible'
  html2canvas(contentDiv).then((canvas) => {
    contentDiv.style.height = `${contentDiv.scrollHeight}px`
    contentDiv.style.overflow = originalOverflow
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    // // 获取PDF页面的宽高
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // // 获取canvas的宽高
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    // // 计算缩放比例
    const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const newWidth = imgWidth * scale
    const newHeight = imgHeight * scale
    // 添加进pdf时，左右间距1cm,上下间距0.5cm

    const leftOffset = 10
    const topOffset = 5
    // 添加图像到PDF
    // 不影响内容的情况下，左右间距1cm,上下间距0.5cm
    const contentWidth = newWidth - leftOffset * 2
    const contentHeight = newHeight - topOffset * 2
    const contentLeft = leftOffset
    const contentTop = topOffset
    pdf.addImage(imgData, 'PNG', contentLeft, contentTop, contentWidth, contentHeight)
    pdf.save(`${name}.pdf`)
  })
}

export interface PDFColumn {
  field: string
  title: string
  width?: number
}

export interface PDFTableOptions {
  title: string
  columns: PDFColumn[]
  data: any[]
  footerData?: any[]
  fileName: string
  orientation?: 'portrait' | 'landscape'
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
 * Draw header on each page - sync with Excel style
 */
function drawPageHeader(
  pdf: jsPDF,
  header: ReportHeader,
  pageNumber: number,
  pageDate: string
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  const titleBoxLeft = 50   // Column C equivalent
  const titleBoxRight = pageWidth - 50  // Column I equivalent
  const titleBoxWidth = titleBoxRight - titleBoxLeft

  let yPos = 10

  // Row 1: REPORT ID (left) + PAGE (right, dynamic)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`REPORT ID: ${header.reportId}`, margin, yPos)
  pdf.text(`PAGE: ${pageNumber}`, pageWidth - margin - 30, yPos)
  yPos += 5

  // Row 2: COMPILED BY (left) + DATE (right)
  pdf.text(`COMPILED BY: ${header.compiledBy}`, margin, yPos)
  pdf.text(`DATE: ${pageDate}`, pageWidth - margin - 30, yPos)
  yPos += 5

  // Title box: fixed 3 rows height (15mm)
  const titleBoxTop = yPos
  const titleBoxHeight = 5  // 3 rows * 5mm each
  const titleBoxBottom = titleBoxTop + titleBoxHeight

  // Row 3: PROJECT (left)
  pdf.text(`PROJECT: ${header.project}`, margin, yPos)

  // Title text - centered in box, vertically centered (no border)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const titleText = `${header.title}\n${header.subtitle}\n${header.dateRange}`
  const titleLines = titleText.split('\n')
  const lineHeight = 5
  const totalTextHeight = titleLines.length * lineHeight
  // Calculate vertical middle of the 3-row box
  const textStartY = titleBoxTop + (titleBoxHeight - totalTextHeight) / 2 + 4

  titleLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, textStartY + (index * lineHeight), { align: 'center' })
  })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)

  // Input filters on left side (below title box)
  let filterY = titleBoxBottom + 3
  if (header.inputProject !== undefined) {
    pdf.text(`Input Project: ${header.inputProject || 'NULL'}`, margin, filterY)
    filterY += 4
  }
  if (header.inputFrom !== undefined) {
    pdf.text(`Input From: ${header.inputFrom || 'NULL'}`, margin, filterY)
    filterY += 4
  }
  if (header.inputTo !== undefined) {
    pdf.text(`Input To: ${header.inputTo || 'NULL'}`, margin, filterY)
    filterY += 4
  }
  if (header.inputIncluded !== undefined) {
    pdf.text(`Input Included: ${header.inputIncluded || '-'}`, margin, filterY)
    filterY += 4
  }
  if (header.stage !== undefined) {
    pdf.text(`Stage: ${header.stage}`, margin, filterY)
    filterY += 4
  }

  // Remark (for SCS-102) - below title box
  let finalY = filterY + 5
  if (header.remark) {
    pdf.setTextColor(255, 0, 0)
    pdf.text(header.remark, margin, finalY)
    pdf.setTextColor(0, 0, 0)
    finalY += 6
  }

  return finalY
}

/**
 * Export report with headers to PDF
 */
export function exportReportToPDF(header: ReportHeader, columns: PDFColumn[], data: any[]): void {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  // Prepare table data
  const headers = columns.map((col) => col.title)
  const dataRows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
        return formatDate(value)
      }
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  // Add total row if specified (for SCS-102)
  if (header.totalLabel && header.totalValue !== undefined) {
    const totalRow = new Array(columns.length).fill('')
    totalRow[0] = header.totalLabel
    totalRow[1] = String(header.totalValue)
    dataRows.push(totalRow)
  }

  // Fixed header height: 2 rows (10mm) + title box (15mm) + input filters
  let inputFilterRows = 0
  if (header.inputProject !== undefined) inputFilterRows++
  if (header.inputFrom !== undefined) inputFilterRows++
  if (header.inputTo !== undefined) inputFilterRows++
  if (header.inputIncluded !== undefined) inputFilterRows++
  if (header.stage !== undefined) inputFilterRows++
  // Row 1-2: 10mm, Title box (3 rows): 15mm, spacing: 5mm, input filters: 4mm each
  const headerHeight = 30 + (inputFilterRows * 4)
  const startY = headerHeight + 5

  let isFirstPage = true
  let finalY = 0

  // Generate table
  autoTable(pdf, {
    head: [headers],
    body: dataRows,
    startY: startY,
    margin: { left: margin, right: margin, top: headerHeight + 15, bottom: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber
      // Draw header on each page
      drawPageHeader(pdf, header, pageNumber, pageDate)

      // On subsequent pages, cursor.y should be below header
      if (!isFirstPage) {
        data.cursor.y = headerHeight + 10
      }
      isFirstPage = false
    },
    didDrawCell: (data) => {
      // Track final Y position
      finalY = data.cell.y + data.cell.height
    }
  })

  // Add "END OF REPORT" marker at the bottom
  const pageHeight = pdf.internal.pageSize.getHeight()
  const markerY = Math.min(finalY + 10, pageHeight - 10)
  pdf.setFontSize(9)
  pdf.text('*** END OF REPORT ***', pageWidth / 2, markerY, { align: 'center' })

  pdf.save(`${header.reportId}_${timestamp}.pdf`)
}

/**
 * Export table data to PDF using autoTable (legacy function)
 */
export function exportTableToPDF(options: PDFTableOptions): void {
  const orientation = options.orientation || 'landscape'
  const pdf = new jsPDF(orientation, 'mm', 'a4')

  // Add title
  pdf.setFontSize(14)
  pdf.text(options.title, 14, 15)

  // Prepare headers
  const headers = options.columns.map((col) => col.title)

  // Prepare data rows
  const dataRows = options.data.map((row) => {
    return options.columns.map((col) => {
      const value = row[col.field]
      // Handle HTML content
      if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
        return formatDate(value)
      }
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  // Add footer if provided
  if (options.footerData && options.footerData.length > 0) {
    options.footerData.forEach((footerRow) => {
      const footerDataRow = options.columns.map((col) => {
        const value = footerRow[col.field]
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          return formatDate(value)
        }
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value != null ? String(value) : ''
      })
      dataRows.push(footerDataRow)
    })
  }

  // Calculate column widths
  const pageWidth = orientation === 'landscape' ? 297 : 210
  const margin = 14
  const availableWidth = pageWidth - margin * 2

  let columnStyles: Record<number, { cellWidth: number }> = {}

  // If columns have explicit widths, use them
  const hasExplicitWidths = options.columns.some((col) => col.width)
  if (hasExplicitWidths) {
    const totalExplicitWidth = options.columns.reduce((sum, col) => sum + (col.width || 0), 0)
    const autoWidthCols = options.columns.filter((col) => !col.width).length
    const autoWidth = autoWidthCols > 0 ? (availableWidth - totalExplicitWidth) / autoWidthCols : 0

    options.columns.forEach((col, index) => {
      columnStyles[index] = { cellWidth: col.width || autoWidth }
    })
  }

  // Generate table using autoTable
  autoTable(pdf, {
    head: [headers],
    body: dataRows,
    startY: 25,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [26, 188, 156],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: hasExplicitWidths ? columnStyles : undefined,
    didDrawPage: (data) => {
      // Add page number
      pdf.setFontSize(8)
      pdf.text(
        `Page ${data.pageNumber}`,
        pageWidth - margin,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      )
    }
  })

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0]
  pdf.save(`${options.fileName}_${timestamp}.pdf`)
}

/**
 * Export multiple tables to a single PDF (for SCS-101)
 */
export function exportSCS101ToPDF(
  header: ReportHeader,
  tables: { title: string; columns: PDFColumn[]; data: any[] }[]
): void {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  let isFirstPage = true
  let currentTableIndex = 0
  let currentPageNumber = 1
  tables.forEach((table, index) => {
    // Add new page for subsequent tables
    if (index > 0) {
      pdf.addPage()
      isFirstPage = true
    }

    currentTableIndex = index

    // Prepare headers and data
    const headers = table.columns.map((col) => col.title)
    const dataRows = table.data.map((row) => {
      return table.columns.map((col) => {
        const value = row[col.field]
        if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
          return formatDate(value)
        }
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value != null ? String(value) : ''
      })
    })

    // Add table title to header for this table
    const tableHeader = { ...header }
    const startY = drawPageHeader(pdf, tableHeader, currentPageNumber, pageDate)
    // Generate table using autoTable
    autoTable(pdf, {
      head: [headers],
      body: dataRows,
      startY: startY,
      margin: { left: margin, right: margin, top: 50, bottom: 10 },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 0,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber
        // Draw header on each page
        // const startY = drawPageHeader(pdf, tableHeader, pageNumber, pageDate)

        if (!isFirstPage) {
          const startY = drawPageHeader(pdf, tableHeader, currentPageNumber, pageDate)
        }
        currentPageNumber ++
        // Add table title below header
        if (isFirstPage) {
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.text(table.title, margin, startY - 2)
          pdf.setFont('helvetica', 'normal')
          isFirstPage = false
        }
      }
    })
  })

  pdf.save(`${header.reportId}_${timestamp}.pdf`)
}

/**
 * Export SCS-103 report with main table and summary table to PDF
 */
export function exportSCS103ToPDF(
  header: ReportHeader,
  mainColumns: PDFColumn[],
  mainData: any[],
  summaryColumns: PDFColumn[],
  summaryData: any[]
): void {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  // Fixed header height: 2 rows (10mm) + title box (15mm) + input filters
  let inputFilterRows = 0
  if (header.inputProject !== undefined) inputFilterRows++
  if (header.inputFrom !== undefined) inputFilterRows++
  if (header.inputTo !== undefined) inputFilterRows++
  if (header.stage !== undefined) inputFilterRows++
  // Row 1-2: 10mm, Title box (3 rows): 15mm, spacing: 5mm, input filters: 4mm each
  const headerHeight = 30 + (inputFilterRows * 4)

  let isFirstPage = true
  let mainTableFinished = false
  let currentPage = 1
  // Prepare main table data
  const mainHeaders = mainColumns.map((col) => col.title)
  const mainDataRows = mainData.map((row) => {
    return mainColumns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
        return formatDate(value)
      }
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  // Generate main table
  autoTable(pdf, {
    head: [mainHeaders],
    body: mainDataRows,
    startY: headerHeight + 10,
    margin: { left: margin, right: margin, top: headerHeight + 15, bottom: 10 },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber
      drawPageHeader(pdf, header, currentPage, pageDate)
      currentPage ++
      if (!isFirstPage && !mainTableFinished) {
        data.cursor.y = headerHeight + 10
      }
    },
    didDrawCell: () => {
      mainTableFinished = true
    }
  })

  // Add summary table on new page
  pdf.addPage()
  isFirstPage = true
  drawPageHeader(pdf, header, 1, pageDate)

  // Add summary title
  const summaryTitleY = headerHeight + 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Summary', margin, summaryTitleY)
  pdf.setFont('helvetica', 'normal')

  // Prepare summary table data
  const summaryHeaders = summaryColumns.map((col) => col.title)
  const summaryDataRows = summaryData.map((row) => {
    return summaryColumns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  // Generate summary table
  autoTable(pdf, {
    head: [summaryHeaders],
    body: summaryDataRows,
    startY: summaryTitleY + 5,
    margin: { left: margin, right: margin, top: headerHeight + 15, bottom: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber
      currentPage++
      drawPageHeader(pdf, header, currentPage, pageDate)

      if (!isFirstPage) {
        data.cursor.y = headerHeight + 10
      }
      isFirstPage = false
    }
  })

  pdf.save(`${header.reportId}_${timestamp}.pdf`)
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
 * Format date for report header (DD/MM/YYYY)
 */
function formatDateForReport(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
