import { h } from 'vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { AttachmentCellValue, ViewRenderFunctionParams } from '../../../types/column-types'

type LegacyAttachmentValue = {
  id?: string
  file_name?: string
  name?: string
  mime_type?: string
  mimeType?: string
  size?: number
  uploaded_by?: string
  uploaded_at?: string
}

function parseAttachmentString(rawValue: string): AttachmentCellValue[] {
  const value = rawValue.trim()
  if (!value) return []

  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return normalizeAttachmentValue(JSON.parse(value))
    } catch {
      return []
    }
  }

  return value.split(',').filter(Boolean).map((fileName) => ({
    id: fileName,
    file_name: fileName,
    mime_type: ''
  }))
}

export function normalizeAttachmentValue(rawValue: unknown): AttachmentCellValue[] {
  if (!rawValue) return []

  if (typeof rawValue === 'string') {
    return parseAttachmentString(rawValue)
  }

  const source = Array.isArray(rawValue) ? rawValue : [rawValue]
  return source.reduce<AttachmentCellValue[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc

    const attachment = item as LegacyAttachmentValue
    const id = attachment.id || attachment.file_name || attachment.name
    const fileName = attachment.file_name || attachment.name || attachment.id
    if (!id || !fileName) return acc

    acc.push({
      id,
      file_name: fileName,
      mime_type: attachment.mime_type || attachment.mimeType || '',
      size: attachment.size,
      uploaded_by: attachment.uploaded_by,
      uploaded_at: attachment.uploaded_at
    })
    return acc
  }, [])
}

export const AttachmentView = ({ params }: ViewRenderFunctionParams<AttachmentCellValue[]>) => {
  const { $grid, row, column } = params
  const attachments = normalizeAttachmentValue(row[column.field])

  const cellEvents = {
    onMouseenter: (e: MouseEvent) => {
      $grid?.dispatchEvent('cell-mouseenter', { row, column }, e)
    },
    onMouseleave: (e: MouseEvent) => {
      $grid?.dispatchEvent('cell-mouseleave', { row, column }, e)
    }
  }

  if (!attachments.length) {
    return h('div', { class: 'attachment-view mb-table-cell', ...cellEvents }, '-')
  }

  return h(
    'div',
    { class: 'attachment-view mb-table-cell', ...cellEvents },
    attachments.map((attachment) =>
      h('img', {
        key: attachment.id,
        class: 'attachment-view__file-icon',
        src: mimeTypeToIcon(attachment.mime_type),
        title: attachment.file_name,
        alt: '',
        'aria-hidden': 'true'
      })
    )
  )
}
