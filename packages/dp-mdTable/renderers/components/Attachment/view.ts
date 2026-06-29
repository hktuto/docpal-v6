import { h } from 'vue'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'
import type { AttachmentCellValue, ViewRenderFunctionParams } from '../../../types/column-types'

export const AttachmentView = ({ params }: ViewRenderFunctionParams<AttachmentCellValue[]>) => {
  const { $grid, row, column } = params
  const attachments = (row[column.field] ?? []) as AttachmentCellValue[]

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
