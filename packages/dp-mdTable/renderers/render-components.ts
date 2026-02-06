// renderers/separate-components.ts
import { h } from 'vue'
import type { VNode } from 'vue'
import { ElRate, ElInput } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import type { RenderComponentConfig, ViewRenderFunctionParams } from '../types/column-types'
import { ElSelect, ElOption, ElInputNumber } from 'element-plus'
import { renderSelectView, renderMultipleSelectView } from './components/select/view'
import SelectEdit from './components/select/edit.vue'
import { NumberView, NumberEdit } from './components/number/view'
import { DateTimeView, DateTimeEdit } from './components/DateTime/view'
import { EmailView, EmailEdit } from './components/email/view'
import { MultiTextView, MultiTextEdit } from './components/MultiText/view'
import { TextView, TextEdit } from './components/text/view'
import { UserView, UserEdit } from './components/user/view'
import { RelationView, RelationEdit } from './components/relation/view'
import RelationEditVue from './components/relation/edit.vue'
import { VirtualColumnView, VirtualColumnEdit } from './components/VirtualColumn/view'
import { FormulaView } from './components/formula'
import { CheckboxView } from './components/checkbox'
import { TreeNode } from './components/treeNode'
// 分离模式组件配置
export const MDTableComponents: Record<string, RenderComponentConfig> = {
  Text: {
    edit: {
      render: TextEdit
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
      render: MultiTextEdit
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
        const inputRef = ref<any>(null)
        return h(ElInput, {
          modelValue: data.text,
          'onUpdate:modelValue': (value: string) => {
            row[column.field] = [{ text: value, title: value }]
          },
          class: 'vxe-cell-absolute mdTable-height-edit mdTable-input-radius',
          'suffix-icon': EditPen,
          ref: inputRef,
          onVnodeMounted: () => {
            nextTick(() => {
              inputRef.value.focus()
            })
          }
        })
      }
    }
  },
  Number: {
    edit: {
      render: NumberEdit
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
      render: DateTimeEdit
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
      render: EmailEdit
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
  MagicLink: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $table, row, column } = params
        const relationOptions = options?.props || {}
        
        // Get the base relation field name (without display field suffix)
        const baseRelationFieldName = column.field.includes('.') 
          ? column.field.split('.')[0] 
          : column.field
        
        // Get current value from the base relation field (UUID array)
        const currentValue = row[baseRelationFieldName] || []
        
        return h(RelationEditVue, {
          modelValue: currentValue,
          relationTableId: relationOptions.relationTableId,
          displayField: relationOptions.displayField || relationOptions.displayFieldNames?.[0] || 'id',
          multiple: true,
          placeholder: 'Select related records...',
          'onUpdate:modelValue': (value: string[]) => {
            // Update the base relation field with the selected UUIDs
            row[baseRelationFieldName] = value
            
            // Also update the display values for the view
            // This will be fetched when the data is refreshed
          }
        })
      }
    },
    view: {
      render: (params: any) => TreeNode(params, RelationView)
    }
  },
  VirtualColumn: {
    titleConfig: {
      icon: 'lucide:columns-3',
      content: 'Virtual Column'
    },
    view: {
      render: (params: any) => TreeNode(params, VirtualColumnView)
    },
    edit: {
      render: VirtualColumnEdit
    }
  },
  User: {
    view: {
      render: (params: any) => TreeNode(params, UserView)
    },
    edit: {
      render: UserEdit
    }
  },
  Formula: {
    both: {
      render: (params: any) => TreeNode(params, FormulaView)
    }
  },
  Checkbox: {
    both: {
      render: (params: any) => TreeNode(params, CheckboxView)
    }
  }
} as const
