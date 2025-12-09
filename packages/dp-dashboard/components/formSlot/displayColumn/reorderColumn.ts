import dayjs from 'dayjs'
export async function formSlotOrderDisplayColumns(fields: any, tabProvider: any, closeDialog?: any) {
  try {
    const columns: any = []
    if (fields.length > 0) {
      const columneFromSetting = fields.reduce((prev: any, item: any) => {
        const newItem: any = {
          field: item.value,
          title: item.label && item.label.includes('ID') ? item.label : item.label.toLowerCase().replace(/\b\w/g, (s: any) => s.toUpperCase()),
          minWidth: 200
        }
        if (['date', 'timestamp'].includes(item.type)) {
          const prefix = item.prefix || ''
          const suffix = item.suffix || ''
          newItem.formatter = ({ cellValue }: any) => {
            if (!cellValue) return '-'
            try {
              if (item.dateDisplay === 'duration') {
                const diff = dayjs().diff(cellValue, 'day')
                return prefix + diff + ' days' + suffix
              }
              if (item.dateFormat) {
                return prefix + formatDate(cellValue, item.dateFormat) + suffix
              }
              return prefix + formatDate(cellValue) + suffix
            } catch (e) {
              return '-'
            }
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
        } else if (item.prefix || item.suffix) {
          newItem.formatter = ({ cellValue }: any) => {
            return item.prefix + cellValue + item.suffix
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
    if(!value) return '--'
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
