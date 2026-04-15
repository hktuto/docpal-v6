import type { RenderComponentConfig } from '../../../types/column-types'
import { VirtualColumnView } from './view'

export const VirtualColumnConfig: RenderComponentConfig = {
  name: 'VirtualColumn',
  titleConfig: {
    icon: 'lucide:columns-3',
    content: 'Virtual Column'
  },
  view: {
    name: 'VirtualColumnView',
    render: VirtualColumnView,
    defaultOptions: {
      displayMode: 'text',
      aggregation: 'all',
      showUniqueOnly: false,
      separator: ', '
    }
  }
}
