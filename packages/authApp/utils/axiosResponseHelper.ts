import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { EventType, emitBus } from 'eventbus'

/** TODO: workflow 僅支持 X-Tenant-ID 的請求方式 */
const WORKFLOW_PATH = '/oniflow/api/v1/'
const TOKEN_PATH = '/auth/refresh'

type RetryConfig = AxiosRequestConfig & { _retry?: boolean }

function resolveBaseUrl(baseURL: string) {
  const {
    public: { DASHBOARD_PROXY, CLIENT_PROXY, ADMIN_PROXY, PROXY, OPEN_PROXY, DOCPAL_GATEWAY_PROXY, DOCPAL_GATEWAY_PROXY_V1 }
  } = useRuntimeConfig()

  const map: Record<string, string> = {
    '/dashboard': DASHBOARD_PROXY || '/public-api/report/v1/api',
    '/client': CLIENT_PROXY || '/api',
    '/admin/api': ADMIN_PROXY || '/admin/api',
    '/adminApi/api': ADMIN_PROXY || '/admin/api',
    '/apis': (DOCPAL_GATEWAY_PROXY as string) || '/apis',
    '/api': PROXY || '/api',
    '/docpalApi': PROXY || '/api',
    '/public-api/report/v1/api': DASHBOARD_PROXY || '/public-api/report/v1/api',
    '/open-api/template': (OPEN_PROXY as string) || '/open-api/template',
    '/gateway': (DOCPAL_GATEWAY_PROXY_V1 as string) || '/apis/v1/ucenter'
  }

  return map[baseURL] || baseURL
}

function expireSession() {
  useToken().clearToken()
  emitBus(EventType.USER_LOGIN__EXPIRE)
  // TODO: remove logout, should use event bus
  logout()
}

function refreshAccessToken() {
  // 与定时器 / 其它调用方共用 useToken 内的单次 refreshPromise
  return useToken().handleRefreshToken()
}

export function requestSuccessHelper(config: AxiosRequestConfig, _axiosInstance?: AxiosInstance) {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
    config.headers['accept-language'] = localStorage.getItem('v_form_locale') || 'en-US'
    // TODO: 等待後端更改登錄接口，從登錄接口獲取該環境變量
    if (config.url?.includes(WORKFLOW_PATH)) {
      config.headers['X-Tenant-ID'] = 'demo'
      config.headers['X-User-ID'] = useUserId().value
    }
  }

  if (process.env.NODE_ENV !== 'development' && config.baseURL) {
    config.baseURL = resolveBaseUrl(config.baseURL)
    console.log('config.baseURL', config.baseURL)
  }

  return config
}

export function requestErrorHelper(error: AxiosError, _axiosInstance?: AxiosInstance) {
  return Promise.reject(error)
}

export function responseSuccessHelper(response: AxiosResponse, _axiosInstance?: AxiosInstance) {
  return response
}

export async function responseErrorHelper(error: AxiosError, axiosInstance: AxiosInstance) {
  const status = error.response?.status
  if (!status) return Promise.reject(error)

  const originalRequest = error.config as RetryConfig | undefined

  // 强制下线
  if (status === 420) {
    expireSession()
    return
  }

  if (status === 403) {
    expireSession()
    return Promise.reject(error)
  }

  // 401：刷新 token 后，用「原请求所在 instance」重试，保留各自 baseURL
  if (status === 401) {
    const isRefreshCall = originalRequest?.url?.includes(TOKEN_PATH)
    const alreadyRetried = originalRequest?._retry
    const hasRefreshToken = !!localStorage.getItem('refresh_token')

    if (!originalRequest || !axiosInstance || isRefreshCall || alreadyRetried || !hasRefreshToken) {
      expireSession()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const accessToken = await refreshAccessToken()
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axiosInstance(originalRequest)
    } catch (refreshError: any) {
      const refreshStatus = refreshError.response?.status
      if (refreshStatus === 401 || refreshStatus === 403 || refreshStatus === 500 || !refreshError.response) {
        expireSession()
      }
      return Promise.reject(refreshError)
    }
  }

  // 其它 4xx/5xx：按 header 决定是否弹错 / 吞错
  const headers = error.config?.headers as Record<string, unknown> | undefined
  if (headers?.noThrowError) return
  if (!headers?.noErrorMessage) {
    const message = (error.response?.data as any)?.message || error.message
    if (message) ElMessage.error(message)
  }

  return Promise.reject(error)
}
