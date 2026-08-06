import { Admin } from './generate/admin'
// import { Public } from './generate/public'
import { Template } from './generate/template'
import { Standard } from './generate/newClient'
import { Gateway } from './generate/gateway'
export type { MenuDTO, MenuRequestDTO, ResultListMenuDTO } from './generate/newClient'

let clientBaseURL = '/'
// let publicBaseURL = '/public-api/report/v1/api'
let templateBaseURL = '/open-api/template'
let gatewayBaseURL = '/gateway/v1'
export const clientApi = new Standard({
  baseURL: clientBaseURL,
  timeout: 50000
})

export const adminApi = new Admin({
  baseURL: clientBaseURL,
  timeout: 50000
})
export const gatewayApi = new Gateway({
  baseURL: gatewayBaseURL,
  timeout: 50000
})
export const newClientApi = clientApi.api

export const newAdminApi = clientApi.admin

export const globalApi = window.location.pathname.includes('admin') ? newAdminApi : newClientApi

/*export const publicApi = new Public({
  baseURL: publicBaseURL,
  timeout: 50000
})*/

export const templateApi = new Template({
  baseURL: templateBaseURL,
  timeout: 50000
})

export type DynamicActionConditionType = 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'ILIKE' | string

export interface DynamicActionColumn {
  name: string
}

export interface DynamicActionCondition {
  type: DynamicActionConditionType
  column?: string
  value: unknown
}

export interface DynamicActionsRequestBody {
  dryRun?: boolean
  table?: string
  tableId?: string
  columns: DynamicActionColumn[]
  conditions?: DynamicActionCondition[]
  pagination?: {
    pageSize?: number
    pageNum?: number
  }
}

export function postDynamicActions(body: DynamicActionsRequestBody) {
  // 使用相对 path，便于 dev 走 Vite 代理、生产在拦截器里把 baseURL 换成 DOCPAL_GATEWAY_PROXY
  return clientApi.instance.post('/v1/dynamic-actions', body, {
    baseURL: '/gateway',
    headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

// if node env mode is dev set proxy
export function PostgREST_Decorate(params: any) {
  const strArr = params.reduce((prev: any, item: any) => {
    switch (item.type) {
      case 'select':
        prev.push(`select=${item.value}`)
        break
      case 'neq':
      case 'eq':
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        prev.push(`${item.key}=${item.type}.${item.value}`)
        break
      case 'like':
        prev.push(`${item.key}=like.*${item.value}*`)
        break
      case 'ilike':
        prev.push(`${item.key}=ilike.*${item.value}*`)
        break
      case 'isNull':
        prev.push(`${item.key}=is.null`)
        break
      case 'isNotNull':
        prev.push(`${item.key}=is.not.null`)
        break
      case 'in':
        const values = item.value.join(',')
        prev.push(`${item.key}=in.(${values})`)
        break
      case 'cs':
        const jsonValue = JSON.stringify(item.value)
        prev.push(`${item.key}=cs.${jsonValue}`)
        break
      default:
        prev.push(`${item.type}=${item.value}`)
        break
    }
    return prev
  }, [])
  return strArr.join('&')
}
