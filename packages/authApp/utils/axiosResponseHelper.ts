import type { AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus'
import { useEventBus, EventType, emitBus } from 'eventbus'

/**
 * Case conversion utilities for API responses
 */
function getBaseUrl(baseURL: string) {
  const {
    public: { DASHBOARD_PROXY, CLIENT_PROXY, ADMIN_PROXY, PROXY, OPEN_PROXY, DOCPAL_GATEWAY_PROXY }
  } = useRuntimeConfig()
  if (baseURL === '/dashboard') baseURL = DASHBOARD_PROXY
  if (baseURL === '/client') baseURL = CLIENT_PROXY
  if (baseURL === '/admin/api') baseURL = ADMIN_PROXY
  if (baseURL === '/api') baseURL = PROXY
  if (baseURL === '/adminApi/api') baseURL = ADMIN_PROXY
  if (baseURL === '/docpalApi') baseURL = PROXY
  if (baseURL === '/public-api/report/v1/api') baseURL = DASHBOARD_PROXY
  if (baseURL === '/open-api/template') baseURL = OPEN_PROXY as string
  if (baseURL === '/dynamic-actions') baseURL = DOCPAL_GATEWAY_PROXY as string
  return baseURL
}

export const requestSuccessHelper = (config: any, axiosInstance: AxiosInstance) => {
  // const {locale} = useI18n()
  // console.log(locale)
  const locale = localStorage.getItem('v_form_locale') || 'en-US'
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['accept-language'] = locale
  }
  if (process.env.NODE_ENV !== 'development') {
    const {
      public: { DOCPAL_GATEWAY_PROXY }
    } = useRuntimeConfig()
    const pathOnly = typeof config.url === 'string' ? config.url.split('?')[0] : ''
    const hitsDynamicActions =
      pathOnly === '/dynamic-actions' || config.baseURL === '/dynamic-actions'
    if (hitsDynamicActions && DOCPAL_GATEWAY_PROXY) {
      config.baseURL = DOCPAL_GATEWAY_PROXY as string
      if (!config.url) {
        config.url = '/dynamic-actions'
      }
    } else if (config.baseURL) {
      config.baseURL = getBaseUrl(config.baseURL)
    }
  }
  return config
}
export const requestErrorHelper = (error: any, axiosInstance: AxiosInstance) => {
  return Promise.reject(error)
}

export const responseSuccessHelper = (response: any, axiosInstance: AxiosInstance) => {
  return response
}

export const responseErrorHelper = async (error: any, axiosInstance: AxiosInstance) => {
  const originalRequest = error.config
  console.log('responseErrorHelper', error)
  if (!error.response) return Promise.reject(error)
  if (error.response.status === 420) {
    console.log('token expired, clear token and redirect to login page')
    // TODO : may need to handle error message
    emitBus(EventType.USER_LOGIN__EXPIRE)
    // TODO : remove logout, should use event bus
    logout()
    return
  }

  if (error.response.status >= 500) {
    if (error.config.headers.noThrowError) return

    if (error.config.headers.noErrorMessage) return Promise.reject(error)

    const message = error.response.data.message || error.message
    ElMessage.error(message)
    return Promise.reject(error)
  }
  if (error.response.status === 403) {
    console.log('token expired, clear token and redirect to login page')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    emitBus(EventType.USER_LOGIN__EXPIRE)
    logout()
    return Promise.reject(error)
  }
  console.log('error', error, this)
  const refreshToken = localStorage.getItem('refresh_token')
  if (error.response.status === 401 && !originalRequest._retry && refreshToken) {
    originalRequest._retry = true

    try {
      // 使用 refresh token 获取新的 access token

      localStorage.setItem('access_token', refreshToken as string)

      const { data } = await axiosInstance.post(
        '/auth/token',
        {},
        {
          headers: {
            Authorization: 'Bearer ' + refreshToken
          },
          baseURL: '/api'
        }
      )
      console.log('retry', data)
      console.log('refresh token response', data)
      if (!data) {
        logout()
        return Promise.reject(new Error('refresh token response is null'))
      }
      localStorage.setItem('access_token', data.data.access_token)
      localStorage.setItem('refresh_token', data.data.refresh_token)
      const token = useToken()
      token.value = data.data.access_token
      return axiosInstance(originalRequest)
    } catch (refreshError: any) {
      console.log('refresh error', refreshError)
      // 如果 refresh token 也过期了，则清除所有存储的 token，并导航到登录页面
      if (refreshError.response?.status === 403 || refreshError.response?.status === 500) {
        console.log('token expired, clear token and redirect to login page')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // notify other via event bus
        emitBus(EventType.USER_LOGIN__EXPIRE)
        // TODO : remove logout, should use event bus
        logout()
      }

      return Promise.reject(refreshError)
    }
  } else {
    // 如果没有 refresh token，则直接退出登录
    logout()
  }

  return Promise.reject(error)
}
