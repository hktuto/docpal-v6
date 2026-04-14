import type { ViewRenderFunctionParams, VirtualColumnOptions } from '../../../types/column-types'
import { ColumnFieldType } from '../../../types/column-types'
import { h } from 'vue'
import { ElTag } from 'element-plus'
import {
  renderAsSingleSelect,
  renderAsMultiSelect,
  renderAsNumber,
  renderAsDateTime,
  renderAsEmail,
  renderAsURL,
  renderAsPhone,
  renderAsCheckbox,
  renderAsRating,
  renderAsText
} from './renderHelpers'

export const VirtualColumnView = ({ options, params }: ViewRenderFunctionParams<string>) => {
  const { row, column } = params
  const props: any = options?.props || {}
  const virtual_field_name = props?.virtual_field_name
  const rawValues = row[virtual_field_name]
  if (!rawValues || (Array.isArray(rawValues) && rawValues.length === 0)) {
    return h('div', { class: 'virtual-column-view empty' }, '-')
  }

  let displayValues = Array.isArray(rawValues) ? [...rawValues] : [rawValues]
  if (props?.showUniqueOnly) {
    displayValues = [...new Set(displayValues)]
  }
  
  const tags: ReturnType<typeof h>[] = []
  for (let i = 0; i < displayValues.length; i++) {
    tags.push(
      h(
        ElTag,
        {
          key: `${virtual_field_name}-${i}`,
          size: 'small',
          type: 'info'
        },
        () => String(displayValues[i] ?? '-')
      )
    )
  }

  return h(
    'div',
    {
      class: 'virtual-column-view',
      style: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap'
      }
    },
    tags
  )
}
