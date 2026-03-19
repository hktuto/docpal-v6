// PDF to Image conversion using pdfjs-dist
// Following the same pattern as pdftoimg-js

// Default CDN worker URL (using latest stable version)
let workerSrc: string = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/legacy/build/pdf.worker.min.mjs'

/**
 * Set custom PDF.js worker URL
 */
export function setPdfWorkerSrc(src: string): void {
  if (src) {
    workerSrc = src
  }
}

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
}

export interface RenderOptions {
  scale?: number
  maxWidth?: number
  maxHeight?: number
  dpi?: number  // Target DPI (default: 300)
}

export interface PDFWrapper {
  file: File
  numPages: number
  doc: any
}

/**
 * Load PDF document
 */
export async function loadPDF(source: File | ArrayBuffer): Promise<PDFWrapper> {
  const file = source instanceof File ? source : new File([source], 'document.pdf', { type: 'application/pdf' })

  // Dynamic import of pdfjs-dist legacy build
  const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/legacy/build/pdf.mjs')
  console.log('pdfjsLib', pdfjsLib)
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

  const data = await file.arrayBuffer()
  const task = pdfjsLib.getDocument({ data })
  const doc = await task.promise.then((pdfDoc) => pdfDoc)

  return {
    file,
    numPages: doc.numPages,
    doc
  }
}


/**
 * Get information about all pages in a PDF
 */
export async function getPDFPagesInfo(pdf: PDFWrapper): Promise<PDFPageInfo[]> {
  const pages: PDFPageInfo[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.doc.getPage(i)
    const viewport = page.getViewport({ scale: 1 })
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height
    })
  }

  return pages
}

/**
 * Render a PDF page to a canvas
 *
 * DPI Calculation:
 * - PDF internal units are in points (1/72 inch)
 * - Default PDF DPI is 72
 * - To get 300 DPI output, scale = 300/72 = 4.166...
 * - If PDF specifies different DPI, we use that instead
 */
export async function renderPDFPageToCanvas(pdf: PDFWrapper, pageNumber: number, options: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const { scale, maxWidth, maxHeight, dpi = 300 } = options
  const page = await pdf.doc.getPage(pageNumber)

  // Get page info to determine PDF DPI
  // PDF default is 72 DPI (1 point = 1/72 inch)
  const defaultPdfDpi = 72
  const targetDpi = dpi || 300

  // Calculate scale to achieve target DPI
  // If PDF has its own DPI, we would calculate: targetDpi / pdfDpi
  // Since most PDFs use 72 DPI, the scale factor is: 300/72 = 4.166...
  const dpiScale = targetDpi / defaultPdfDpi

  // Use provided scale or calculated DPI scale
  let finalScale = scale || dpiScale

  // Get viewport with the scale
  let viewport = page.getViewport({ scale: finalScale })

  // Calculate scale to fit within max dimensions if specified
  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / viewport.width : Infinity
    const scaleY = maxHeight ? maxHeight / viewport.height : Infinity
    const fitScale = Math.min(scaleX, scaleY)

    // Only apply fit scale if it's smaller than our target scale
    // This ensures we don't upscale beyond target DPI
    if (fitScale < 1) {
      finalScale = finalScale * fitScale
      viewport = page.getViewport({ scale: finalScale })
    }
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise

  return canvas
}

/**
 * Convert PDF page to image data URL
 */
export async function pdfPageToImageUrl(pdf: PDFWrapper, pageNumber: number, options: RenderOptions = {}): Promise<string> {
  const canvas = await renderPDFPageToCanvas(pdf, pageNumber, options)
  return canvas.toDataURL('image/png')
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}
