import { defineNuxtPlugin, useAuth } from '#imports'
import { clientApi, adminApi, publicApi } from 'api'
import Keycloak from 'keycloak-js'
import { requestSuccessHelper, requestErrorHelper, responseSuccessHelper, responseErrorHelper } from '../utils/axiosResponseHelper'

function isPublicPage(path: string, publicPages: (string | RegExp)[]): boolean {
  return publicPages.some((page) => {
    if (typeof page === 'string') {
      return page === path
    } else if (page instanceof RegExp) {
      return page.test(path)
    }
    return false
  })
}

export default defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.hook('app:created', async () => {
    const publicPage = usePublicPageState()
    // check is path public
    // if pagePage is a REGEX , need to test the math
    if (isPublicPage(window.location.pathname, publicPage.value) || window.location.pathname.startsWith('/public')) {
      console.log('publicPage', publicPage.value)
      return
    }
    // const { data } = await clientApi.api.getRelationGetkeycloakproperty();
    // keyCloakState.value = new Keycloak({
    //   "url": data?.keyCloakProperty?.url,
    //   "realm": data?.keyCloakProperty?.realm || "", // ldap: docpal_third_party
    //   "clientId": data?.keyCloakProperty?.clientId || "",
    //   // @ts-ignore
    //   "ssl-required": data?.keyCloakProperty.sslRequired || "",
    //   "public-client": data?.keyCloakProperty?.publicClient || "",
    //   "confidential-port": data?.keyCloakProperty?.confidentialPort || ""
    // });
    // isSSO.value = !!data?.keyCloakProperty?.enableSSO;
    // isLDAP.value = !!data?.isLdap;
  })

  nuxtApp.hook('app:mounted', async () => {
    const publicPage = usePublicPageState()
    // check is path public
    if (isPublicPage(window.location.pathname, publicPage.value) || window.location.pathname.startsWith('/public')) {
      return
    }
    await useAuth().login()
  })

  // set refresh token to clientApi and adminApi
  publicApi.instance.interceptors.request.use(
    (config) => {
      return requestSuccessHelper(config, publicApi.instance)
    },
    (error) => requestErrorHelper(error, publicApi.instance)
  )
  publicApi.instance.interceptors.response.use(
    (config) => responseSuccessHelper(config, publicApi.instance),
    (error) => responseErrorHelper(error, publicApi.instance)
  )
  clientApi.instance.interceptors.request.use(
    (config) => requestSuccessHelper(config, clientApi.instance),
    (error) => requestErrorHelper(error, clientApi.instance)
  )
  clientApi.instance.interceptors.response.use(
    (config) => responseSuccessHelper(config, clientApi.instance),
    (error) => responseErrorHelper(error, clientApi.instance)
  )
  adminApi.instance.interceptors.request.use(
    (config) => requestSuccessHelper(config, adminApi.instance),
    (error) => requestErrorHelper(error, adminApi.instance)
  )
  adminApi.instance.interceptors.response.use(
    (config) => responseSuccessHelper(config, adminApi.instance),
    (error) => responseErrorHelper(error, adminApi.instance)
  )
})
