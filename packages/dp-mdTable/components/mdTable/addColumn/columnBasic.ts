import { ColumnFieldType } from '../../../types/column-types'
export const columnBasic: any = {
  [ColumnFieldType.Text]: {
    isBasic: true
  },
  [ColumnFieldType.Number]: {
    isBasic: true,
    component: 'Number'
  },
  [ColumnFieldType.DateTime]: {
    isBasic: true,
    component: 'DateTime'
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
        value: value,
      }
      if (fieldSetting.component) {
        item.component = fieldSetting.component
      }
      basicOptions.push(item)
    } else {
      const item: any = {
        label: key,
        value: value,
      }
      if (fieldSetting?.component) {
        item.component = fieldSetting.component
      }
      advancedOptions.push(item)
    }
  })
  return [
    {
      label: 'Basic',
      options: basicOptions
    },
    {
      label: 'Advanced',
      options: advancedOptions
    }
  ]
}
