import { ColumnFieldType } from '../../../types/column-types'
export const columnBasic: any = {
  [ColumnFieldType.Text]: {
    isBasic: true,
    order: 1
  },
  [ColumnFieldType.MultiText]: {
    isBasic: true,
    order: 2
  },
  [ColumnFieldType.Number]: {
    isBasic: true,
    component: 'Number',
    order: 3
  },
  [ColumnFieldType.DateTime]: {
    isBasic: true,
    component: 'DateTime',
    order: 4
  },
  [ColumnFieldType.SingleSelect]: {
    isBasic: true,
    component: 'Select'
  },
  [ColumnFieldType.MultiSelect]: {
    isBasic: true,
    component: 'Select'
  },
  [ColumnFieldType.Rating]: {
    isBasic: true,
    component: 'Rating'
  },
  [ColumnFieldType.URL]: {
    isBasic: true
  },
  [ColumnFieldType.Email]: {
    isBasic: true
  },
  [ColumnFieldType.Phone]: {
    isBasic: true
  },
  [ColumnFieldType.Checkbox]: {
    isBasic: true,
    component: 'Checkbox'
  },
  [ColumnFieldType.Member]: {
    isBasic: true,
    component: 'Member'
  },
  [ColumnFieldType.Formula]: {
    isBasic: false,
    component: 'Formula',
    order: 1
  }
}
export function getColumnFieldOptions() {
  const ColumnFieldTypeMap = Object.fromEntries(Object.entries(ColumnFieldType).filter(([key, value]) => typeof value === 'number'))
  const basicOptions: any[] = []
  const advancedOptions: any[] = []
  Object.entries(ColumnFieldTypeMap).forEach(([key, value]) => {
    const fieldSetting: any = columnBasic[value]
    if (fieldSetting?.isBasic) {
      const item: any = {
        label: key,
        value: value
      }
      if (fieldSetting.component) {
        item.component = fieldSetting.component
      }
      item.order = fieldSetting.order || 999
      basicOptions.push(item)
    } else {
      const item: any = {
        label: key,
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
