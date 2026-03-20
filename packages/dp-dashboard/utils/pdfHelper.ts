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
 * Export report with headers to PDF
 */
export function exportReportToPDF(header: ReportHeader, columns: PDFColumn[], data: any[]): void {
  const pdf = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 14
  const timestamp = new Date().toISOString().split('T')[0]
  const pageDate = formatDateForReport(new Date())

  let yPos = 10

  // Report header section (left side)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`REPORT ID: ${header.reportId}`, margin, yPos)
  pdf.text(`PAGE: 1`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`COMPILED BY: ${header.compiledBy}`, margin, yPos)
  pdf.text(`DATE: ${pageDate}`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`PROJECT: ${header.project}`, margin, yPos)
  yPos += 8

  // Input filters
  pdf.setFontSize(8)
  if (header.inputProject !== undefined) {
    pdf.text(`Input Project: ${header.inputProject || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputFrom !== undefined) {
    pdf.text(`Input From: ${header.inputFrom || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputTo !== undefined) {
    pdf.text(`Input To: ${header.inputTo || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputIncluded !== undefined) {
    pdf.text(`Input Included: ${header.inputIncluded || '-'}`, margin, yPos)
    yPos += 4
  }
  if (header.stage !== undefined) {
    pdf.text(`Stage: ${header.stage}`, margin, yPos)
    yPos += 4
  }

  // Title section (centered)
  yPos += 5
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  const titleX = pageWidth / 2
  pdf.text(header.title, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.text(header.subtitle, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.setFont('helvetica', 'normal')
  pdf.text(header.dateRange, titleX, yPos, { align: 'center' })
  yPos += 8

  // Remark (for SCS-102)
  if (header.remark) {
    pdf.setFontSize(8)
    pdf.setTextColor(255, 0, 0) // Red color for remark
    pdf.text(header.remark, margin, yPos)
    pdf.setTextColor(0, 0, 0) // Reset to black
    yPos += 6
  }

  // Prepare table data
  const headers = columns.map((col) => col.title)
  const dataRows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  // Generate table
  autoTable(pdf, {
    head: [headers],
    body: dataRows,
    startY: yPos,
    margin: { left: margin, right: margin },
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
      // Add page number at bottom
      let finalY = pdf.internal.pageSize.getHeight() - 10
      pdf.setFontSize(8)
      pdf.text(`Page ${data.pageNumber}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - 10, {
        align: 'right'
      })
      // Add total row if specified (for SCS-102)
      if (header.totalLabel && header.totalValue !== undefined) {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${header.totalLabel} ${header.totalValue}`, margin, finalY)
        pdf.setFont('helvetica', 'normal')
        finalY += 8
      }

      // End of report marker
      pdf.setFontSize(9)
      pdf.text('*** END OF REPORT ***', pageWidth / 2, finalY + 5, { align: 'center' })

      // Save PDF

    }
  })
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
export function exportMultipleTablesToPDF(
  tables: { title: string; columns: PDFColumn[]; data: any[] }[],
  mainTitle: string,
  fileName: string
): void {
  const pdf = new jsPDF('landscape', 'mm', 'a4')

  // Add main title
  pdf.setFontSize(16)
  pdf.text(mainTitle, 14, 15)

  let startY = 25

  tables.forEach((table, index) => {
    // Add table title
    pdf.setFontSize(12)
    pdf.text(table.title, 14, startY)
    startY += 6

    // Prepare headers and data
    const headers = table.columns.map((col) => col.title)
    const dataRows = table.data.map((row) => {
      return table.columns.map((col) => {
        const value = row[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
      return value != null ? String(value) : ''
      })
    })

    // Check if we need a new page
    const estimatedHeight = dataRows.length * 5 + 20
    const pageHeight = pdf.internal.pageSize.getHeight()
    if (startY + estimatedHeight > pageHeight - 20) {
      pdf.addPage()
      startY = 20
    }

    // Generate table using autoTable
    autoTable(pdf, {
      head: [headers],
      body: dataRows,
      startY: startY,
      margin: { left: 14, right: 14 },
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

    })

  })

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0]
  pdf.save(`${fileName}_${timestamp}.pdf`)
}

/**
 * Export SCS-103 report with headers and 2 tables
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

  let yPos = 10

  // Report header section (left side)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`REPORT ID: ${header.reportId}`, margin, yPos)
  pdf.text(`PAGE: 1`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`COMPILED BY: ${header.compiledBy}`, margin, yPos)
  pdf.text(`DATE: ${pageDate}`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`PROJECT: ${header.project}`, margin, yPos)
  yPos += 8

  // Input filters
  pdf.setFontSize(8)
  if (header.inputProject !== undefined) {
    pdf.text(`Input Project: ${header.inputProject || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputFrom !== undefined) {
    pdf.text(`Input From: ${header.inputFrom || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputTo !== undefined) {
    pdf.text(`Input To: ${header.inputTo || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.stage !== undefined) {
    pdf.text(`Stage: ${header.stage}`, margin, yPos)
    yPos += 4
  }

  // Title section (centered)
  yPos += 5
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  const titleX = pageWidth / 2
  pdf.text(header.title, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.text(header.subtitle, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.setFont('helvetica', 'normal')
  pdf.text(header.dateRange, titleX, yPos, { align: 'center' })
  yPos += 10

  // ===== Table 1: Main Data =====
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Details', margin, yPos)
  yPos += 5
  pdf.setFont('helvetica', 'normal')

  const mainHeaders = mainColumns.map((col) => col.title)
  const mainDataRows = mainData.map((row) => {
    return mainColumns.map((col) => {
      const value = row[col.field]
      if (typeof value === 'string' && value.includes('<')) {
        return stripHtml(value)
      }
      return value != null ? String(value) : ''
    })
  })

  const mainResult = autoTable(pdf, {
    head: [mainHeaders],
    body: mainDataRows,
    startY: yPos,
    margin: { left: margin, right: margin },
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
    }
  })

  yPos = mainResult.finalY + 10

  // Check if we need a new page for summary
  if (yPos > pdf.internal.pageSize.getHeight() - 60) {
    pdf.addPage()
    yPos = 20
  }

  // ===== Table 2: Summary Data =====
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Summary', margin, yPos)
  yPos += 5
  pdf.setFont('helvetica', 'normal')

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

  const summaryResult = autoTable(pdf, {
    head: [summaryHeaders],
    body: summaryDataRows,
    startY: yPos,
    margin: { left: margin, right: margin },
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
    }
  })

  // End of report marker
  pdf.setFontSize(9)
  pdf.text('*** END OF REPORT ***', pageWidth / 2, summaryResult.finalY + 10, { align: 'center' })

  // Save PDF
  pdf.save(`${header.reportId}_${timestamp}.pdf`)
}

/**
 * Export SCS-101 report with headers and multiple tables
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

  let yPos = 10

  // Report header section (left side)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`REPORT ID: ${header.reportId}`, margin, yPos)
  pdf.text(`PAGE: 1`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`COMPILED BY: ${header.compiledBy}`, margin, yPos)
  pdf.text(`DATE: ${pageDate}`, pageWidth - margin - 30, yPos, { align: 'left' })
  yPos += 5

  pdf.text(`PROJECT: ${header.project}`, margin, yPos)
  yPos += 8

  // Input filters
  pdf.setFontSize(8)
  if (header.inputProject !== undefined) {
    pdf.text(`Input Project: ${header.inputProject || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputFrom !== undefined) {
    pdf.text(`Input From: ${header.inputFrom || 'NULL'}`, margin, yPos)
    yPos += 4
  }
  if (header.inputTo !== undefined) {
    pdf.text(`Input To: ${header.inputTo || 'NULL'}`, margin, yPos)
    yPos += 4
  }

  // Title section (centered)
  yPos += 5
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  const titleX = pageWidth / 2
  pdf.text(header.title, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.text(header.subtitle, titleX, yPos, { align: 'center' })
  yPos += 6
  pdf.setFont('helvetica', 'normal')
  pdf.text(header.dateRange, titleX, yPos, { align: 'center' })
  yPos += 10

  // Process each table
  tables.forEach((table, index) => {
    // Check if we need a new page
    if (yPos > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage()
      yPos = 20
    }

    // Add table title
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(table.title, margin, yPos)
    yPos += 5
    pdf.setFont('helvetica', 'normal')

    // Prepare headers and data
    const headers = table.columns.map((col) => col.title)
    const dataRows = table.data.map((row) => {
      return table.columns.map((col) => {
        const value = row[col.field]
        if (typeof value === 'string' && value.includes('<')) {
          return stripHtml(value)
        }
        return value != null ? String(value) : ''
      })
    })

    // Generate table using autoTable
    const result = autoTable(pdf, {
      head: [headers],
      body: dataRows,
      startY: yPos,
      margin: { left: margin, right: margin },
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
      }
    })

  })

  // End of report marker
  pdf.setFontSize(9)
  pdf.text('*** END OF REPORT ***', pageWidth / 2, yPos + 5, { align: 'center' })

  // Save PDF
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
