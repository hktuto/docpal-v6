/**
 * Render helper functions for VirtualColumn
 * These functions handle rendering of aggregated values from virtual columns
 * using the target field's display configuration
 */

import { h } from 'vue'
import { ElTag } from 'element-plus'
import dayjs from 'dayjs'
import type { TargetFieldConfig } from '../../../types/column-types'
/**
 * Render values as MultiSelect tags with colors
 */
export function renderAsSingleSelect(values: any[], targetConfig: any, separator: string = ', '): ReturnType<typeof h> {
  const options = targetConfig.properties?.options || targetConfig.options || []
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }
  // Flatten nested arrays (each value might be an array of selections)
  const flatValues: any[] = Array.isArray(values) ? values : [values]
  return h(
    'div',
    {
      class: 'virtual-column-view select-tags',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    flatValues.map((val: any, index: number) => {
      let option = options.find((o: any) => o.id === val || o.value === val || o.label === val)
      if (!option) option = { label: '-', color: '#dddddd' }
      return h(
        'div',
        {
          key: index,
          class: 'table-tag',
          style: option?.color ? `--color: ${option.color}` : undefined
        },
        option?.label || String(val ?? '')
      )
    })
  )
}
/**
 * Render values as MultiSelect tags with colors
 */
export function renderAsMultiSelect(values: any[], targetConfig: any, separator: string = ', '): ReturnType<typeof h> {
  const options = targetConfig.properties?.options || targetConfig.options || []
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }
  // Flatten nested arrays (each value might be an array of selections)
  const flatValues: any[] = Array.isArray(values) ? values : [values]
  return h(
    'div',
    {
      class: 'virtual-column-view select-tags',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    flatValues.map((val: any, index: number) => {
      const vals = Array.isArray(val) ? val : [val]
      const result = vals.map((v: any) => {
        let option = options.find((o: any) => o.id === v || o.value === v || o.label === v)
        return option?.label || '-'
      })
      return h(
        'div',
        {
          key: index,
          class: 'table-tag',
          style: `--color: #dddddd`
        },
        result.join(separator)
      )
    })
  )
}

/**
 * Render values as formatted numbers
 */
export function renderAsNumber(values: any[], targetConfig: TargetFieldConfig, separator: string = ', '): ReturnType<typeof h> {
  const props = targetConfig.properties || targetConfig || {}
  const precision = props.precision ?? 0
  const showThouComma = props.showThouComma ?? false
  const symbol = props.symbol
  const symbolAlign = props.symbolAlign || 'left'

  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  const formattedValues = values.map((val: any) => {
    if (val == null || isNaN(Number(val))) {
      return String(val ?? '-')
    }

    let formatted = Number(val).toFixed(precision)

    if (showThouComma) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    if (symbol) {
      formatted = symbolAlign === 'left' ? symbol + formatted : formatted + symbol
    }

    return formatted
  })

  return h(
    'div',
    {
      class: 'virtual-column-view number',
      'data-title': formattedValues.join(separator)
    },
    formattedValues.join(separator)
  )
}

/**
 * Render values as formatted dates/times
 */
export function renderAsDateTime(values: any[], targetConfig: TargetFieldConfig, separator: string = ', '): ReturnType<typeof h> {
  const props = targetConfig.properties || {}
  const dateFormat = props.dateFormat || 'YYYY-MM-DD'
  const includeTime = props.includeTime || false
  const dateTimeFormat = props.dateTimeFormat || 'HH:mm'

  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  const format = includeTime ? `${dateFormat} ${dateTimeFormat}` : dateFormat

  const formattedValues = values.map((val: any) => {
    if (!val) return '-'
    return dayjs(val).format(format)
  })

  return h(
    'div',
    {
      class: 'virtual-column-view datetime',
      title: formattedValues.join(separator)
    },
    formattedValues.join(separator)
  )
}

/**
 * Render values as email links
 */
export function renderAsEmail(values: any[], separator: string = ', '): ReturnType<typeof h> {
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  if (values.length === 1) {
    return h(
      'a',
      {
        class: 'virtual-column-view email',
        href: `mailto:${values[0]}`,
        'data-title': values[0]
      },
      values[0]
    )
  }

  return h(
    'div',
    {
      class: 'virtual-column-view email-list',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    values.map((val: any, index: number) =>
      h(
        'a',
        {
          key: index,
          class: 'email-link',
          href: `mailto:${val}`
        },
        val
      )
    )
  )
}

/**
 * Render values as URL links
 */
export function renderAsURL(values: any[], separator: string = ', '): ReturnType<typeof h> {
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  return h(
    'div',
    {
      class: 'virtual-column-view url-list',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    values.map((val: any, index: number) =>
      h(
        'a',
        {
          key: index,
          class: 'url-link',
          href: val,
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        val
      )
    )
  )
}

/**
 * Render values as phone links
 */
export function renderAsPhone(values: any[], separator: string = ', '): ReturnType<typeof h> {
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  if (values.length === 1) {
    return h(
      'a',
      {
        class: 'virtual-column-view phone',
        href: `tel:${values[0]}`
      },
      values[0]
    )
  }

  return h(
    'div',
    {
      class: 'virtual-column-view phone-list',
      style: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }
    },
    values.map((val: any, index: number) =>
      h(
        'a',
        {
          key: index,
          class: 'phone-link',
          href: `tel:${val}`
        },
        val
      )
    )
  )
}

/**
 * Render values as checkbox indicators
 */
export function renderAsCheckbox(values: any[], separator: string = ', '): ReturnType<typeof h> {
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  // For single value, show a checkbox icon
  if (values.length === 1) {
    const isChecked = Boolean(values[0])
    return h(
      'div',
      {
        class: 'virtual-column-view checkbox'
      },
      isChecked ? '✓' : '✗'
    )
  }

  // For multiple values, show count of checked
  const checkedCount = values.filter(Boolean).length
  return h(
    'div',
    {
      class: 'virtual-column-view checkbox-count'
    },
    `${checkedCount}/${values.length} ✓`
  )
}

/**
 * Render values as rating stars
 */
export function renderAsRating(values: any[], targetConfig: TargetFieldConfig, separator: string = ', '): ReturnType<typeof h> {
  const maxRating = targetConfig.properties?.max || 5

  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  // For single value, show stars
  if (values.length === 1) {
    const rating = Number(values[0]) || 0
    const stars = '★'.repeat(Math.min(rating, maxRating)) + '☆'.repeat(Math.max(0, maxRating - rating))
    return h(
      'div',
      {
        class: 'virtual-column-view rating',
        style: { color: '#f7ba2a' }
      },
      stars
    )
  }

  // For multiple values, show average or list
  const avg = values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length
  return h(
    'div',
    {
      class: 'virtual-column-view rating-avg'
    },
    `Avg: ${avg.toFixed(1)} ★`
  )
}

/**
 * Render values as plain text (default fallback)
 */
export function renderAsText(values: any[], separator: string = ', '): ReturnType<typeof h> {
  if (values.length === 0) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  return h(
    'div',
    {
      class: 'virtual-column-view text'
    },
    values.map((v) => String(v ?? '')).join(separator)
  )
}
