import type { ViewRenderFunctionParams } from '../../../types/column-types'
import { Icon } from '#components'

function getWebsiteFavicon(url: string): string {
  try {
    const urlText = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const domain = new URL(urlText).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function createUrlIcon(urlText: string) {
  const faviconUrl = getWebsiteFavicon(urlText)
  if (faviconUrl) {
    return h('img', { class: 'url-view__favicon', src: faviconUrl, alt: '' })
  }
  return h(Icon, { name: 'lucide:link', class: 'url-view__icon', size: 14 })
}

export const UrlView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { $grid, row, column } = params
  const data = row[column.field]?.length > 0 ? row[column.field][0] : { text: '', title: '' }
  const urlText = data.text || ''
  const displayText = data.title || data.text || ''

  const cellEvents = {
    onMouseenter: (e: MouseEvent) => {
      $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
    },
    onMouseleave: (e: MouseEvent) => {
      $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
    }
  }

  if (!urlText) {
    return h('div', { class: 'url-view mb-table-cell', ...cellEvents }, '-')
  }

  return h('div', { class: 'url-view mb-table-cell', ...cellEvents }, [
    createUrlIcon(urlText),
    h(
      'a',
      {
        class: 'url-view__link',
        href: urlText,
        target: '_blank',
        rel: 'noopener noreferrer',
        onClick: (e: MouseEvent) => e.stopPropagation()
      },
      displayText
    )
  ])
}
