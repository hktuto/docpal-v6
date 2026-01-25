import { ColumnFieldType } from '../../../types/column-types'
export const columnBasic: any = {
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
  [ColumnFieldType.Member]: {
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
  [ColumnFieldType.MagicLink]: {
    label: 'Relation',
    isBasic: false,
    component: 'Relation'
  },
  [ColumnFieldType.VirtualColumn]: {
    label: 'VirtualColumn',
    isBasic: false,
    disableCreate: true,
    hidden: false, // Not shown in add column dropdown, created via "Add Virtual Column" on relation headers
    component: 'VirtualColumn'
  }
}
export function getColumnFieldOptions() {
  const ColumnFieldTypeMap = Object.fromEntries(Object.entries(ColumnFieldType).filter(([key, value]) => typeof value === 'number'))
  const basicOptions: any[] = []
  const advancedOptions: any[] = []
  Object.entries(ColumnFieldTypeMap).forEach(([key, value]) => {
    const fieldSetting: any = columnBasic[value]
    // Skip hidden types (like VirtualColumn which is created via different UI)
    if (fieldSetting?.hidden) {
      return
    }
    
    if (fieldSetting?.isBasic) {
      const item: any = {
        label: fieldSetting.label || key,
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
        label: fieldSetting?.label ||key,
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
