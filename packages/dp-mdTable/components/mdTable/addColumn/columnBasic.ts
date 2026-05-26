import { ColumnFieldType, reverseColumnFieldType } from '../../../types/column-types'

/** 表头列类型角标（图标 + 提示 + 样式类） */
export type ColumnHeaderIndicator = {
  icon: string
  tooltip: string
  class: string
}

export type ColumnBasicFieldConfig = {
  label: string
  isBasic?: boolean
  order?: number
  component?: string
  disableCreate?: boolean
  hidden?: boolean
  /** 未配置则不显示表头角标 */
  headerIndicator?: ColumnHeaderIndicator
}

export const columnBasic: Partial<Record<ColumnFieldType, ColumnBasicFieldConfig>> = {
  [ColumnFieldType.Text]: {
    label: 'Text',
    isBasic: true,
    order: 1
  },
  [ColumnFieldType.MultiText]: {
    label: 'MultiText',
    isBasic: true,
    order: 2
  },
  [ColumnFieldType.Number]: {
    label: 'Number',
    isBasic: true,
    component: 'Number',
    order: 3
  },
  [ColumnFieldType.DateTime]: {
    label: 'DateTime',
    isBasic: true,
    component: 'DateTime',
    order: 4
  },
  [ColumnFieldType.SingleSelect]: {
    label: 'SingleSelect',
    isBasic: true,
    component: 'Select'
  },
  [ColumnFieldType.MultiSelect]: {
    label: 'MultiSelect',
    isBasic: true,
    component: 'Select'
  },
  [ColumnFieldType.Rating]: {
    label: 'Rating',
    isBasic: true,
    component: 'Rating'
  },
  [ColumnFieldType.URL]: {
    label: 'URL',
    isBasic: true
  },
  [ColumnFieldType.Email]: {
    label: 'Email',
    isBasic: true
  },
  [ColumnFieldType.Phone]: {
    label: 'Phone',
    isBasic: true
  },
  [ColumnFieldType.Checkbox]: {
    label: 'Checkbox',
    isBasic: true,
    component: 'Checkbox'
  },
  [ColumnFieldType.User]: {
    label: 'Member',
    isBasic: true,
    component: 'Member'
  },
  [ColumnFieldType.Formula]: {
    label: 'Formula',
    isBasic: false,
    component: 'Formula',
    order: 1
  },
  [ColumnFieldType.Relation]: {
    label: 'Relation',
    isBasic: false,
    component: 'Relation',
    headerIndicator: {
      icon: 'lucide:link',
      tooltip: 'Relation Column',
      class: 'indicator-relation'
    }
  },
  [ColumnFieldType.VirtualColumn]: {
    label: 'VirtualColumn',
    isBasic: false,
    disableCreate: true,
    hidden: false, // Not shown in add column dropdown, created via "Add Virtual Column" on relation headers
    component: 'VirtualColumn',
    headerIndicator: {
      icon: 'lucide:columns-3',
      tooltip: '【${relation_field_name_alias}】Virtual Column - Display field from relation',
      class: 'indicator-virtual'
    }
  },
  [ColumnFieldType.AggVirtualColumn]: {
    label: 'AggVirtualColumn',
    isBasic: false,
    component: 'VirtualColumn',
    headerIndicator: {
      icon: 'lucide:calculator',
      tooltip: '【${relation_field_name_alias}-${display_field_name_alias}】Aggregate Virtual Column',
      class: 'indicator-agg-virtual'
    }
  }
}

/**
 * 根据列类型解析表头角标配置（数据来自 columnBasic）
 */
export function getColumnHeaderIndicator(columnType: ColumnFieldType, columnConfig: any): ColumnHeaderIndicator | null {
  if (columnType === null || columnType === undefined) {
    return null
  }

  if(columnBasic[columnType]) {
    const headerIndicator = columnBasic[columnType]?.headerIndicator ?? null
    if(headerIndicator) {
      // 抓取变量，${}之间的内容,可能有多个
      const variables = headerIndicator.tooltip.match(/\${(.*?)}/g)
      if(variables) {
        variables.forEach((variable) => {
          const variableName = variable.replace('${', '').replace('}', '')
          if(columnConfig[variableName]) {
            headerIndicator.tooltip = headerIndicator.tooltip.replace(variable, columnConfig[variableName])
          }
        })
      }
    }
    return headerIndicator
  }

  return null
}



export function getColumnFieldOptions() {
  const uniqueFieldValues = [...new Set(Object.values(ColumnFieldType))]
  console.log('uniqueFieldValues', uniqueFieldValues)
  const basicOptions: any[] = []
  const advancedOptions: any[] = []
  uniqueFieldValues.forEach((value) => {
    const fieldSetting: any = columnBasic[value]
    if (fieldSetting?.hidden) {
      return
    }
    if (fieldSetting?.isBasic) {

      const item: any = {
        label: fieldSetting.label || reverseColumnFieldType[value],
        disableCreate: fieldSetting.disableCreate || false,
        value: value
      }
      if (fieldSetting.component) {
        item.component = fieldSetting.component
      }
      item.order = fieldSetting.order || 999
      basicOptions.push(item)
    } else {
      const item: any = {
        label: fieldSetting?.label || reverseColumnFieldType[value],
        disableCreate: fieldSetting?.disableCreate || false,
        value: value
      }
      if (fieldSetting?.component) {
        item.component = fieldSetting.component
      }
      item.order = fieldSetting?.order || 999
      advancedOptions.push(item)
    }
  })

  return [
    {
      label: 'Basic',
      options: basicOptions.sort((a, b) => a.order - b.order)
    },
    {
      label: 'Advanced',
      options: advancedOptions.sort((a, b) => a.order - b.order)
    }
  ]
}

// Helper function to get component for a column type (used when editing)
export function getColumnTypeComponent(type: ColumnFieldType): string | undefined {
  return columnBasic[type]?.component
}
