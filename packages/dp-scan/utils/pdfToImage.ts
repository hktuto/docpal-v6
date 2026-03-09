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
  console.log(`doc`, doc)
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
 */
export async function renderPDFPageToCanvas(pdf: PDFWrapper, pageNumber: number, options: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const { scale = 1.5, maxWidth, maxHeight } = options
  const page = await pdf.doc.getPage(pageNumber)
  let viewport = page.getViewport({ scale })

  // Calculate scale to fit within max dimensions
  let finalScale = scale
  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / viewport.width : Infinity
    const scaleY = maxHeight ? maxHeight / viewport.height : Infinity
    finalScale = Math.min(scale, scaleX, scaleY)
    viewport = page.getViewport({ scale: finalScale })
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
