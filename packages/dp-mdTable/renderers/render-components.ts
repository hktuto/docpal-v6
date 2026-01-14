// renderers/separate-components.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { ElRate, ElInput } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import type { RenderComponentConfig, ViewRenderFunctionParams } from '../types/column-types'
import { ElSelect, ElOption, ElInputNumber } from 'element-plus'
import { renderSelectView, renderMultipleSelectView } from './components/select/view'
import SelectEdit from './components/select/edit.vue'
import { NumberView } from './components/number/view'
import { DateTimeView } from './components/DateTime/view'
import { EmailView, EmailEdit } from './components/email/view'
import { MultiTextView, MultiTextEdit } from './components/MultiText/view'
import { TextView, TextEdit } from './components/text/view'
import { UserView } from './components/user/view'
import { TreeNode } from './components/treeNode'
// 分离模式组件配置
export const MDTableComponents: Record<string, RenderComponentConfig> = {
  Text: {
    edit: {
      render: (params: any) => TreeNode(params, TextEdit)
    },
    view: {
      render: (params: any) => TreeNode(params, TextView)
    }
    // titleConfig: {
    //   icon: 'vxe-icon-user-fill',
    //   useHTML: true,
    //   content: '点击链接：<a href="https://vxeui.com" target="_blank" style="color:#95c7fb;">vxe-ui 官网</a>'
    // }
  },
  MultiText: {
    edit: {
      render: (params: any) => TreeNode(params, MultiTextEdit)
    },
    view: {
      render: (params: any) => TreeNode(params, MultiTextView)
    }
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
          allowHalf
        })
      }
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
          'onUpdate:modelValue': (value: string) => {
            row[column.field] = [{ text: value, title: value }]
          },
          'suffix-icon': EditPen
        })
      }
    }
  },
  Number: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<number>): VNode {
        const { $table, row, column } = params
        const { options: numberOptions } = options?.props
        return h(ElInputNumber, {
          modelValue: row[column.field],
          'onUpdate:modelValue': (value: number) => {
            row[column.field] = value
          }
        })
      }
    },
    view: { render: (params: any) => TreeNode(params, NumberView) }
  },
  SingleSelect: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const { options: selectOptions } = options?.props
        return h(SelectEdit, {
          options: selectOptions,
          multiple: false,
          collapseTags: true,
          filterable: true,
          modelValue: row[column.field],
          popperClass: 'vxe-table--ignore-clear', // 加这个类名，让 table 不會 outside click 改變
          'onUpdate:modelValue': (value: any) => {
            row[column.field] = value
          }
        })
      }
    },
    view: {
      render: (params: any) => TreeNode(params, renderSelectView)
    }
  },
  MultiSelect: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const { options: selectOptions } = options?.props
        return h(SelectEdit, {
          options: selectOptions,
          multiple: true,
          collapseTags: true,
          filterable: true,
          modelValue: row[column.field],
          popperClass: 'vxe-table--ignore-clear', // 加这个类名，让 table 不會 outside click 改變
          'onUpdate:modelValue': (value: any) => {
            row[column.field] = value
          }
        })
      }
    },
    view: {
      render: (params: any) => TreeNode(params, renderMultipleSelectView)
    }
  },
  DateTime: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const { options: dateTimeOptions } = options?.props
        return h(ElInput, {
          modelValue: row[column.field],
          'onUpdate:modelValue': (value: string) => {
            row[column.field] = value
          }
        })
      }
    },
    view: {
      render: (params: any) => TreeNode(params, DateTimeView)
    }
  },
  CreatedTime: {
    both: {
      render: (params: any) => TreeNode(params, DateTimeView)
    }
  },
  LastModifiedTime: {
    both: {
      render: (params: any) => TreeNode(params, DateTimeView)
    }
  },
  Email: {
    edit: {
      render: (params: any) => TreeNode(params, EmailEdit)
    },
    view: {
      render: (params: any) => TreeNode(params, EmailView)
    }
  },
  CreatedBy: {
    both: {
      render: (params: any) => TreeNode(params, UserView)
    }
  },
  LastModifiedBy: {
    both: {
      render: (params: any) => TreeNode(params, UserView)
    }
  },
  Member: {
    both: {
      render: (params: any) => TreeNode(params, UserView)
    }
  }
} as const
