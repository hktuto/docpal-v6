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

/**
 * Export table data to PDF using autoTable
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
    const result = autoTable(pdf, {
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
      }
    })

    // Update startY for next table
    startY = result.finalY + 15
  })

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0]
  pdf.save(`${fileName}_${timestamp}.pdf`)
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
