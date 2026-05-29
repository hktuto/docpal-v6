// renderers/separate-components.ts
import { h, ref, nextTick } from 'vue'
import type { VNode } from 'vue'
import { useMDTableInject } from '../composables/useMDTable'
import { ElRate } from 'element-plus'
import type { RenderComponentConfig, ViewRenderFunctionParams } from '../types/column-types'
import { ElSelect, ElOption, ElInputNumber } from 'element-plus'
import { renderSelectView, renderMultipleSelectView } from './components/select/view'
import SelectEdit from './components/select/edit.vue'
import { NumberView, NumberEdit } from './components/number/view'
import { DateTimeView, DateTimeEdit } from './components/DateTime/view'
import { EmailView, EmailEdit } from './components/email/view'
import { UrlView } from './components/url/view'
import UrlEditVue from './components/url/edit.vue'
import { MultiTextView, MultiTextEdit } from './components/MultiText/view'
import { TextView, TextEdit } from './components/text/view'
import { UserView } from './components/user/view'
import { RelationView } from './components/relation/view'
import RelationEditVue from './components/relation/edit.vue'
import { VirtualColumnView } from './components/VirtualColumn/view'
import { AggVirtualColumnView } from './components/VirtualColumn/agg'
import { FormulaView } from './components/formula'
import { CheckboxView } from './components/checkbox'
import { DocumentView } from './components/document'
import { DocPalDocView } from './components/docPalDoc/view'
import DocPalDocEditVue from './components/docPalDoc/edit.vue'
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
      render: (params: any) => TreeNode(params, UrlView)
    },
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $grid, row, column } = params
        return h(UrlEditVue, {
          row,
          column,
          onMouseenter: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
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
        const { $grid, row, column } = params
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
          },
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
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
        const { $grid, row, column } = params
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
          },
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
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
  Relation: {
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $grid, row, column } = params
        const relationOptions = options?.props || {}
        return h(RelationEditVue, {
          ...relationOptions,
          row: row,
          column: column,
          modelValue: row[column.field],
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          },
          'onUpdate:modelValue': (value: string[] | string | null) => {
            row[column.field] = value
          }
        })
      }
    },
    view: {
      render: (params: any) => TreeNode(params, RelationView)
    }
  },
  VirtualColumn: {
    view: {
      render: (params: any) => TreeNode(params, VirtualColumnView)
    }
  },
  AggVirtualColumn: {
    view: {
      render: (params: any) => TreeNode(params, AggVirtualColumnView)
    }
  },
  User: {
    view: {
      render: (params: any) => TreeNode(params, UserView)
    },
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $grid, row, column } = params
        const { getUserList, userList } = useMDTableInject()
        return h(SelectEdit, {
          options: userList,
          multiple: true,
          collapseTags: true,
          filterable: true,
          modelValue: row[column.field],
          mode: 'noTag',
          popperClass: 'vxe-table--ignore-clear', // 加这个类名，让 table 不會 outside click 改變
          'onUpdate:modelValue': (value: any) => {
            row[column.field] = value
          },
          onMouseenter: (e) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          },
          onVnodeMounted: () => {
            nextTick(() => {
              getUserList()
            })
          }
        })
      }
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
  },
  Document: {
    both: {
      render: (params: any) => TreeNode(params, DocumentView)
    }
  },
  DocPalDoc: {
    view: {
      render: (params: any) => TreeNode(params, DocPalDocView)
    },
    edit: {
      render({ options, params }: ViewRenderFunctionParams<string>): VNode {
        const { $grid, row, column } = params
        return h(DocPalDocEditVue, {
          row,
          column,
          onMouseenter: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseenter', { row, column }, e)
          },
          onMouseleave: (e: MouseEvent) => {
            $grid.dispatchEvent('cell-mouseleave', { row, column }, e)
          }
        })
      }
    }
  }
} as const
