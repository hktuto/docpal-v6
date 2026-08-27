/**
 * Match OCR file name to file_list_info item.name
 * e.g. ocrFileName "1787635402340pdf.pdf" ↔ name "1787635402340pdf"
 */
export function resolveInvoiceFile(ocrFileName: string | null | undefined, fileList: Record<string, any>[] = []) {
  if (!ocrFileName || !fileList.length) return null
  const fileName = String(ocrFileName)
  const key = fileName.replace(/\.[^.]+$/, '')
  return (
    fileList.find((file) => {
      const name = String(file?.name ?? '')
      if (!name) return false
      return name === fileName || name === key || `${name}.${file?.extension || ''}`.replace(/\.$/, '') === fileName
    }) ?? null
  )
}

export function getFileDisplayName(file: Record<string, any> | null | undefined) {
  if (!file) return ''
  return String(file.file_name || file.name || '')
}
