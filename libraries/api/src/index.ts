import { Admin } from './generate/admin'
import { Public } from './generate/public'
import { Template } from './generate/template'
import { Standard } from './generate/newClient'

let clientBaseURL = '/'
let publicBaseURL = '/public-api/report/v1/api'
let templateBaseURL = '/open-api/template'

export const clientApi = new Standard({
  baseURL: clientBaseURL,
  timeout: 50000
})
export const restApi = {}
export const adminApi = new Admin({
  baseURL: clientBaseURL,
  timeout: 50000
})

export const publicApi = new Public({
  baseURL: publicBaseURL,
  timeout: 50000
})

export const templateApi = new Template({
  baseURL: templateBaseURL,
  timeout: 50000
})
export const globalApi = window.location.pathname.includes('admin') ? adminApi : clientApi
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
