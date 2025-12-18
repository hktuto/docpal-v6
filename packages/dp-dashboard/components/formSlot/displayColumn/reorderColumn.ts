import dayjs from 'dayjs'
export async function formSlotOrderDisplayColumns(fields: any, tabProvider: any, closeDialog?: any) {
  try {
    const columns: any = []
    if (fields.length > 0) {
      const columneFromSetting = fields.reduce((prev: any, item: any) => {
        const prefix = item.prefix ? item.prefix : ''
        const suffix = item.suffix ? item.suffix : ''
        const newItem: any = {
          field: item.value,
          title: item.label && item.label.includes('ID') ? item.label : item.label.toLowerCase().replace(/\b\w/g, (s: any) => s.toUpperCase()),
          minWidth: 200
        }
        if (['date', 'timestamp'].includes(item.type)) {
          newItem.formatter = ({ cellValue }: any) => {
            return formSlotHandleDisplayDataMethod(cellValue, item)
          }
        } else if (item.clickAction) {
          // return render @click action
          newItem.cellRender = {
            name: 'ClickActionCell',
            params: {
              linkType: item.clickAction,
              tabProvider: tabProvider,
              closeDialog: closeDialog,
              setting: item
            }
          }
        } else if (item.displayMethod) {
          newItem.formatter = ({ cellValue }: any) => {
            return formSlotHandleDisplayMethod(item, cellValue)
          }
        } else if (item.formatter) {
          newItem.formatter = item.formatter
        } else if (prefix || suffix) {
          newItem.formatter = ({ cellValue }: any) => {
            return prefix + cellValue + suffix
          }
        }
        prev.push(newItem)
        return prev
      }, [])
      columns.splice(0, 0, ...columneFromSetting)
    }
    return columns
  } catch (e) {
    console.log('error', e)
  }
  return []
}

export function formSlotHandleDisplayMethod({ displayMethod, prefix, suffix }: any, value: any) {
  try {
    console.log('value', value, displayMethod, prefix, suffix)
    if (!value && value !== 0) return '--'
    if (!prefix) prefix = ''
    if (!suffix) suffix = ''
    if (['FinancialComputing', 'count'].includes(displayMethod)) {
      return prefix + FinancialComputing(value) + suffix
    } else if (['fileSize'].includes(displayMethod)) {
      return prefix + fileSize(value) + suffix
    } else if (['currency'].includes(displayMethod)) {
      // value is money number, format to 1,000.00
      return prefix + value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('$', '') + suffix
    }
    return prefix + value + suffix
  } catch (e) {
    return '-'
  }
}
export function formSlotHandleDisplayDataMethod(value: any, setting: any) {
  if (!value) return '-'
  // 检查是否日期格式字符
  const prefix = setting.prefix || ''
  const suffix = setting.suffix || ''
  if (!dayjs(value).isValid()) {
    return prefix + value + suffix
  }
  try {
    if (setting.dateDisplay === 'duration') {
      const diff = dayjs().diff(value, 'day')
      return prefix + diff + ' days' + suffix
    }
    if (setting.dateFormat) {
      return prefix + formatDate(value, setting.dateFormat) + suffix
    }
    return prefix + formatDate(value) + suffix
  } catch (e) {
    return '-'
  }
}
