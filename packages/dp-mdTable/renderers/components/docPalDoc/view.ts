import { h } from 'vue'
import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { mimeTypeToIcon } from '../../../../base/utils/browseHelper'

export const DocPalDocView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const doc = row[column.field]
  const routerProvider = inject(MenuRouterKey, null)

  const cellEvents = {
    onMouseenter: (e: MouseEvent) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
    },
    onMouseleave: (e: MouseEvent) => {
      $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
    }
  }

  function handleOpenDocument(targetDoc: { id: string; name?: string }, e: MouseEvent) {
    e.stopPropagation()
    if (!routerProvider) return
    routerProvider.navigateTo(
      createDetailPageParams({
        idOrPath: targetDoc.id,
        docName: targetDoc.name || targetDoc.id
      }),
      true
    )
  }

  const docs = Array.isArray(doc) ? doc : [doc]
  const validDocs = docs.filter((d) => d?.id)

  if (!validDocs.length) {
    return h('div', { class: 'docpal-doc-view mb-table-cell', ...cellEvents }, '-')
  }

  return h(
    'div',
    { class: 'docpal-doc-view mb-table-cell', ...cellEvents },
    validDocs.map((d) => {
      const displayText = d.name || d.id
      return h(
        'a',
        {
          key: d.id,
          class: 'docpal-doc-view__link',
          tabindex: '0',
          role: 'link',
          'aria-label': displayText,
          onClick: (e: MouseEvent) => handleOpenDocument(d, e),
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') handleOpenDocument(d, e as unknown as MouseEvent)
          }
        },
        [
          h('img', {
            class: 'docpal-doc-view__file-icon',
            src: mimeTypeToIcon(d.mimeType || ''),
            title: d.name,
            alt: '',
            'aria-hidden': 'true'
          })
        ]
      )
    })
  )
}
