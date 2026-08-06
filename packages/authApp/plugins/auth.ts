import { defineNuxtPlugin, useAuth } from '#imports'
import { clientApi, adminApi, gatewayApi } from 'api'
import { requestSuccessHelper, requestErrorHelper, responseSuccessHelper, responseErrorHelper } from '~/utils/axiosResponseHelper'

function bindAuthInterceptors(axiosInstance: typeof clientApi.instance) {
  axiosInstance.interceptors.request.use(
    (config) => requestSuccessHelper(config, axiosInstance),
    (error) => requestErrorHelper(error, axiosInstance)
  )
  axiosInstance.interceptors.response.use(
    (response) => responseSuccessHelper(response, axiosInstance),
    (error) => responseErrorHelper(error, axiosInstance)
  )
}

function isPublicPath(pathname: string) {
  const publicPage = usePublicPageState()
  return publicPage.value.includes(pathname) || pathname.startsWith('/public')
}

export default defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.hook('app:mounted', async () => {
    if (isPublicPath(window.location.pathname)) return

    const { loggedIn, silentLogin } = useAuth()
    if (loggedIn.value) return

    try {
      await silentLogin()
    } catch (e) {
      console.error(e)
    }
  })

  // 每个 instance 自带 baseURL；401 retry 必须回到「触发错误的那个 instance」
  bindAuthInterceptors(clientApi.instance)
  bindAuthInterceptors(adminApi.instance)
  bindAuthInterceptors(gatewayApi.instance)
})
