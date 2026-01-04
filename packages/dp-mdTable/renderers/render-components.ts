// renderers/separate-components.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { ElRate,ElInput } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import type { RenderComponentConfig, ViewRenderFunctionParams } from '../types/column-types'

// 分离模式组件配置
export const MDTableComponents: Record<string, RenderComponentConfig> = {
  Text: {
    edit: { name: 'VxeInput' },
    // titleConfig: {
    //   icon: 'vxe-icon-user-fill',
    //   useHTML: true,
    //   content: '点击链接：<a href="https://vxeui.com" target="_blank" style="color:#95c7fb;">vxe-ui 官网</a>'
    // }
  },
  Rating: {
    both: {
      render({ options, params }) {
        const { $table, row, column } = params
        console.log(row, column)
        const props = options.options || {}
        return h(ElRate, {
          modelValue: Number(row[column.field]) || 0,
          'onUpdate:modelValue': (value: number) => {
            row[column.field] = value
            // $table.updateStatus(row)  // 如果需要触发表格的更新事件
          },
          max: props.max || 4,
          ...props
        })
      },
    }
  },
  URL: {
    view: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const data = row[column.field]?.length > 0 ? row[column.field][0] : { text: '', title: '' }
        return h('a', { href: data.text, target: '_blank' }, data.text)
      }
    },
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const data = row[column.field]?.length > 0 ? row[column.field][0] : { text: '', title: '' }
        return h(ElInput, { 
          modelValue: data.text, 
          'onUpdate:modelValue': (value: string) => { row[column.field] = [{ text: value, title: value }] },
          'suffix-icon': EditPen
        })
      }
    }
  },
  Number: {
    edit: { name: 'VxeInput', props: { type: 'number' } }
  },
} as const
