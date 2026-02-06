import type * as pdfjsTypes from 'pdfjs-dist';

export type PDFDocument = pdfjsTypes.PDFDocumentProxy;

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export interface RenderOptions {
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Get pdfjs instance from Nuxt plugin
 */
function getPdfjs(): typeof pdfjsTypes {
  const { $pdfjs } = useNuxtApp();
  return $pdfjs as typeof pdfjsTypes;
}

/**
 * Load PDF from File or ArrayBuffer
 */
export async function loadPDF(source: File | ArrayBuffer): Promise<pdfjsTypes.PDFDocumentProxy> {
  const pdfjs = getPdfjs();
  
  let data: ArrayBuffer;
  
  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }
  
  const loadingTask = pdfjs.getDocument({ data });
  return await loadingTask.promise;
}

/**
 * Get information about all pages in a PDF
 */
export async function getPDFPagesInfo(pdf: pdfjsTypes.PDFDocumentProxy): Promise<PDFPageInfo[]> {
  const pages: PDFPageInfo[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
    });
  }
  
  return pages;
}

/**
 * Render a PDF page to a canvas
 */
export async function renderPDFPageToCanvas(
  pdf: pdfjsTypes.PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  const { scale = 1.5, maxWidth, maxHeight } = options;
  
  const page = await pdf.getPage(pageNumber);
  let viewport = page.getViewport({ scale });
  
  // Calculate scale to fit within max dimensions
  let finalScale = scale;
  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / viewport.width : Infinity;
    const scaleY = maxHeight ? maxHeight / viewport.height : Infinity;
    finalScale = Math.min(scale, scaleX, scaleY);
    viewport = page.getViewport({ scale: finalScale });
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;
  
  return canvas;
}

/**
 * Convert PDF page to image data URL
 */
export async function pdfPageToImageUrl(
  pdf: pdfjsTypes.PDFDocumentProxy,
  pageNumber: number,
  options: RenderOptions = {}
): Promise<string> {
  const canvas = await renderPDFPageToCanvas(pdf, pageNumber, options);
  return canvas.toDataURL('image/png');
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
