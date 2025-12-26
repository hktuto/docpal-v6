// renderers/separate-components.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { ColumnFieldType } from '../types/column-types'
import { ElRate } from 'element-plus'
import type { SeparateComponentConfig, ViewRenderFunctionParams, EditRenderFunctionParams, SelectOption } from '../types/column-types'

// 分离模式组件配置
export const MDTableComponents: Record<string, SeparateComponentConfig> = {
  Text: {
    edit: { name: 'VxeInput' }
  },
  Rating: {
    both: {
      render({ options, params }) {
        const { $table, row, column } = params
        const props = options.options || {}
        return h(ElRate, {
          modelValue: Number(row[column.field]) || 0,
          'onUpdate:modelValue': (value: number) => {
            row[column.field] = value
            // $table.updateStatus(row)  // 如果需要触发表格的更新事件
          },
          max: props.max || 5,
          ...props
        })
      },
      defaultOptions: {}
    }
  },
  URL: {
    view: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const value = row[column.field][0].text
        return h('a', { href: value, target: '_blank' }, value)
      }
    },
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        console.log('aaaaaaaaaaaa')
        console.log(options, params, '-view')
        const value = row[column.field][0].text
        return h('a', { href: value, target: '_blank' }, value)
      }
    }
  },
  Number: {
    edit: { name: 'VxeInput', props: { type: 'number' } }
  },
} as const
