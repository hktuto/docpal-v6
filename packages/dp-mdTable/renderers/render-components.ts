// renderers/separate-components.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { ElRate,ElInput } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import type { RenderComponentConfig, ViewRenderFunctionParams } from '../types/column-types'
import { ElSelect,ElOption } from 'element-plus'
import { renderSelectView, renderMultipleSelectView } from './components/select/view'
import SelectEdit from './components/select/edit.vue'
// 分离模式组件配置
export const MDTableComponents: Record<string, RenderComponentConfig> = {
  Text: {
    edit: { name: 'VxeInput', props: { type: 'textarea', rows: 3 } },
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
        const props = options.props || {}
        const max = props.max ? Number(props.max) : 5
        const allowHalf = props.allowHalf ? props.allowHalf : false
        return h(ElRate, {
          modelValue: Number(row[column.field]) || 0,
          'onUpdate:modelValue': (value: number) => {
            row[column.field] = value
            // $table.updateStatus(row)  // 如果需要触发表格的更新事件
          },
          max,
          allowHalf,
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
  SingleSelect: {
    edit: { 
      render({options, params}: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const { options: selectOptions } = options?.props
        return h(SelectEdit, { 
          options: selectOptions,
          multiple: false,
          collapseTags: true,
          filterable:true,
          modelValue: row[column.field], 
          popperClass:'vxe-table--ignore-clear', // 加这个类名，让 table 不會 outside click 改變
          'onUpdate:modelValue': (value: any) => { 
            row[column.field] = value 
          } 
          })
      }
     },
    view: { 
      render: renderSelectView
     }
  },
  MultiSelect: {
    edit: { 
      render({options, params}: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const { options: selectOptions } = options?.props
        return h(SelectEdit, { 
          options: selectOptions,
          multiple: true,
          collapseTags: true,
          filterable:true,
          modelValue: row[column.field], 
          popperClass:'vxe-table--ignore-clear', // 加这个类名，让 table 不會 outside click 改變
          'onUpdate:modelValue': (value: any) => { 
            row[column.field] = value } 
          })
      }
     },
    view: {
      render: renderMultipleSelectView
    }
  },
} as const
