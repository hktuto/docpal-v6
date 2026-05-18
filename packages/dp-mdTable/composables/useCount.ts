import { ref, unref, type Ref } from 'vue'
import { postDynamicActions } from 'api'
import type { CountMethod } from '../types/count-type'
import { formatNumber } from '@packages/dp-mdTable/utils/fieldValueFormat'
type CountColumnsSource = Ref<any[]> | any[]

export interface CountColumn {
  name: string
  alias: string
  aggFunc: Exclude<CountMethod, 'none'>
}
export interface MdCountContext {
  aggData: Ref<any>
  aggLoading: Ref<boolean>
  getAgg: (options?: { silent?: boolean }) => Promise<any>
  getCount: (field: string, method: CountMethod) => any
}
export const MdCountKey: InjectionKey<MdCountContext> = Symbol('MdCountKey')
export function useCount(props: any) {
  const tableId = props.tableId
  const columnsSource = props.extraColumnConfig?.columns
  const viewTools: any = inject('viewTools', null)
  const aggData = ref<any>({})
  const aggLoading = ref(false)

  function getAggRequestParams() {
    const columns = getAggColumns(columnsSource.value)
    const requestParams: Record<string, any> = {
      tableId,
      columns
    }
    if (viewTools?.getPageParams) {
      const { orderBy: _orderBy, groupBy: _groupBy, pagination: _pagination, columns: _columns, ...filterParams } =
        viewTools.getPageParams({ getGroup: false }) || {}
      if (filterParams.conditions?.length) {
        requestParams.conditions = filterParams.conditions
      }
    }
    return requestParams
  }

  async function getAgg(options?: { silent?: boolean }) {
    const columns = getAggColumns(columnsSource.value)
    if (!tableId || columns.length === 0) {
      aggData.value = undefined
      return undefined
    }

    const shouldShowLoading = !options?.silent
    try {
      if (shouldShowLoading) {
        aggLoading.value = true
      }
      const { data } = await postDynamicActions(getAggRequestParams() as Parameters<typeof postDynamicActions>[0])
      aggData.value = data.data[0] || {}
      return data.data
    } catch (error) {
      console.error('getAgg error', error)
      aggData.value = {}
      return {}
    } finally {
      if (shouldShowLoading) {
        aggLoading.value = false
      }
    }
  }
  function getCount(field: string, method: CountMethod) {
    const value = aggData.value?.[`agg_${field}`]
    const properties = columnsSource.value.find((column: any) => column.field_name === field)?.display_structure
    return formatCount(value, method, properties)
  }
  provide(MdCountKey, {
    aggData,
    aggLoading,
    getAgg,
    getCount
  })
  onMounted(() => {
    getAgg()
  })
  return {
    getAgg
  }
}

export function useCountInject() {
  const CountInject = inject(MdCountKey)
  if (!CountInject) {
    console.error('useCountInject must be used within a component that calls useCountProvider')
  }
  return CountInject
}
export function getAggColumns(columns: any[]): CountColumn[] {
  return columns
    .filter((column: any) => column?.field_name && column?.countMethod && column.countMethod !== 'none')
    .map((column: any) => ({
      name: column.field_name,
      alias: 'agg_' + column.field_name,
      aggFunc: column.countMethod
    }))
}
export function formatCount(value: any, method: CountMethod, properties: Record<string, any> = {}) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (!method || method === 'none') {
    return '-'
  }
  if (method.includes('RATIO')) {
    const percentage = Number(value) * 100
    const roundedPercentage = Math.round((percentage + Math.sign(percentage) * Number.EPSILON) * 100) / 100
    return `${Number(roundedPercentage.toFixed(2))}%`
  }
  const count = Number(value)
  if (Number.isNaN(count)) {
    return '-'
  }
  const rounded = Math.round((count + Math.sign(count) * Number.EPSILON) * 100) / 100
  const result = String(Number(rounded.toFixed(2)))
  if (method.includes('COUNT')) {
    return result
  } else {
    return formatNumber(result, properties)
  }
}
