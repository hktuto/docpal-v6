import type { RenderComponentConfig } from '../../../types/column-types'
import { VirtualColumnView } from './view'

export const VirtualColumnConfig: RenderComponentConfig = {
  name: 'VirtualColumn',
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
