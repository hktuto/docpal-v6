// renderers/registry-manager.ts
import { h } from 'vue'
import { VxeUI } from 'vxe-pc-ui'
import { ColumnFieldType } from '../types/column-types'
import type { ComponentConfig, SeparateComponentConfig } from '../types/column-types'
import { MDTableComponents } from './separate-components'

export interface FieldConfig {
  field: string
  title: string
  type: ColumnFieldType
  options?: {
    viewOptions?: Record<string, any>
    editOptions?: Record<string, any>
  }
}

export interface ColumnConfig {
  field: string
  title: string
  width?: number
  titlePrefix?: {
    icon?: string
    useHTML?: boolean
    content?: string
  }
  cellRender: {
    name: string
    options?: Record<string, any>
  }
  editRender: {
    name: string
    options?: Record<string, any>
  }
}

export class RendererRegistryManager {
  private componentMap = new Map<string, SeparateComponentConfig>()

  constructor() {
    this.componentMap = new Map(Object.entries(MDTableComponents))
  }

  /**
   * 批量注册所有渲染器
   */
  public registerAllRenderers(): void {
    // 遍历所有组件配置
    this.componentMap.forEach((config, key) => {
      if (config.view?.render || config.edit?.render || config.both?.render) {
        this.registerRenderer(config, key)
      }
    })
  }
  private registerRenderer(config: SeparateComponentConfig, name: string): void {
    const { both, view, edit } = config

    // 创建渲染器函数的公共方法
    const createRenderFunction =
      (renderFunc: Function, defaultOptions: any = {}) =>
      (renderOpts: any, params: any) => {
        return renderFunc({
          options: { ...defaultOptions, ...renderOpts },
          params
        })
      }

    // 注册 both 渲染器
    if (both?.render) {
      const render = createRenderFunction(both.render, both.defaultOptions)
      VxeUI.renderer.add(name, {
        renderTableCell: render,
        renderEdit: render
      })
    }
    const renderConfig: any = {}
    if (view?.render) {
      renderConfig.renderTableCell = createRenderFunction(view.render, view.defaultOptions)
    }
    if (edit?.render) {
      renderConfig.renderEdit = createRenderFunction(edit.render, edit.defaultOptions)
    }
    VxeUI.renderer.add(name, {
      ...renderConfig
    })
  }

  /**
   * 获取字段类型的组件配置
   */
  public getComponentConfig(fieldName: string): ComponentConfig | undefined {
    return this.componentMap.get(fieldName)
  }

  public getColumnConfig(
    type: ColumnFieldType,
    viewOptions: Record<string, any> = {},
    editOptions: Record<string, any> = {}
  ): Pick<ColumnConfig, 'cellRender' | 'editRender'> {
    // 1. 使用默认参数值替代空值判断
    viewOptions = viewOptions || {}
    editOptions = editOptions || {}

    const fieldName = ColumnFieldType[type]
    let config: SeparateComponentConfig | undefined = this.getComponentConfig(fieldName)

    if (!config) {
      console.error(`字段类型 ${fieldName} 的组件配置未找到`)
      config = this.getComponentConfig('Text')
    }
    const titleConfig = config?.titleConfig || {}
    const result: Partial<Pick<ColumnConfig, 'cellRender' | 'editRender' | 'titlePrefix'>> = {
    }
    if (config?.titleConfig) {
      result.titlePrefix = config.titleConfig
    }
    // 3. 重构判断逻辑，提取重复代码为函数
    const createRenderConfig = (name: string, options: Record<string, any>) => ({ name, options })

    // 4. 处理 both 配置的情况
    if (config?.both) {
      const bothConfig = config.both
      if (!bothConfig.defaultOptions) {
        bothConfig.defaultOptions = {}
      }
      if (bothConfig.renderer) {
        return { cellRender: bothConfig.renderer, editRender: bothConfig.renderer }
      }
      const baseOptions = { ...bothConfig.defaultOptions }
      const name = bothConfig.render ? fieldName : bothConfig.name
      result.cellRender = createRenderConfig(name!, { ...baseOptions, ...viewOptions })
      result.editRender = createRenderConfig(name!, { ...baseOptions, ...editOptions })
      return result as Pick<ColumnConfig, 'cellRender' | 'editRender' | 'titlePrefix'>
    }

    // 5. 分离处理 view 和 edit 配置
    if (config?.view) {
      const viewConfig = config.view
      if (viewConfig.render || (viewConfig.name && viewConfig.name !== '')) {
        const name = viewConfig.render ? fieldName : viewConfig.name
        result.cellRender = createRenderConfig(name!, {
          ...viewConfig.defaultOptions,
          ...viewOptions
        })
      }
    }

    if (config?.edit) {
      const editConfig = config.edit
      if (editConfig.render || (editConfig.name && editConfig.name !== '')) {
        const name = editConfig.render ? fieldName : editConfig.name
        result.editRender = createRenderConfig(name!, {
          ...editConfig.defaultOptions,
          ...editOptions
        })
      }
    }

    return result as Pick<ColumnConfig, 'cellRender' | 'editRender' | 'titlePrefix'>
  }

  /**
   * 根据字段配置自动生成列定义
   */
  public generateColumnFromField(fieldConfig: FieldConfig): ColumnConfig {
    const { field, title, type, options = {} } = fieldConfig
    const renderConfig = this.getColumnConfig(type, options.viewOptions, options.editOptions)

    const columnConfig: ColumnConfig = {
      field,
      title,
      width: this.getDefaultWidth(type),
      ...renderConfig
    }

    return columnConfig
  }

  /**
   * 获取字段类型的默认宽度
   */
  private getDefaultWidth(type: ColumnFieldType): number {
    const widthMap: Record<ColumnFieldType, number> = {
      [ColumnFieldType.Text]: 200,
      [ColumnFieldType.SingleText]: 250,
      [ColumnFieldType.Number]: 120,
      [ColumnFieldType.SingleSelect]: 120,
      [ColumnFieldType.MultiSelect]: 180,
      [ColumnFieldType.DateTime]: 160,
      [ColumnFieldType.Email]: 180,
      [ColumnFieldType.Phone]: 140,
      [ColumnFieldType.URL]: 200,
      [ColumnFieldType.Checkbox]: 80,
      [ColumnFieldType.Rating]: 100,
      [ColumnFieldType.Currency]: 120,
      [ColumnFieldType.Percent]: 100,
      [ColumnFieldType.Formula]: 150,
      [ColumnFieldType.AutoNumber]: 100,
      [ColumnFieldType.CreatedTime]: 160,
      [ColumnFieldType.LastModifiedTime]: 160,
      [ColumnFieldType.CreatedBy]: 120,
      [ColumnFieldType.LastModifiedBy]: 120,
      [ColumnFieldType.Attachment]: 200,
      [ColumnFieldType.TwoWayLink]: 150,
      [ColumnFieldType.OneWayLink]: 150,
      [ColumnFieldType.Member]: 180,
      [ColumnFieldType.MagicLink]: 150,
      [ColumnFieldType.MagicLookUp]: 150
    }

    return widthMap[type] || 150
  }
}

// 默认导出单例
export const rendererManager = new RendererRegistryManager()
