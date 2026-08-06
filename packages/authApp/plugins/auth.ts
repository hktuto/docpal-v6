import { defineNuxtPlugin, useAuth,  } from '#imports';
import { clientApi, adminApi, gatewayApi } from 'api';
import Keycloak from 'keycloak-js';
import { requestSuccessHelper, requestErrorHelper, responseSuccessHelper, responseErrorHelper } from '~/utils/axiosResponseHelper';

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

export default defineNuxtPlugin(async (nuxtApp) => {

  nuxtApp.hook('app:created', async () => {
    const publicPage = usePublicPageState();
    // check is path public
    if (publicPage.value.includes(window.location.pathname) || window.location.pathname.startsWith('/public')) {
      console.log("publicPage", publicPage.value)
      return;
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
  });

  nuxtApp.hook('app:mounted', async () => {
    const publicPage = usePublicPageState();
    // check is path public
    if (publicPage.value.includes(window.location.pathname) || window.location.pathname.startsWith('/public')) {
      return;
    }
    try {
      console.log('defineNuxtPlugin')
      await useAuth().login()
    } catch (e) {
      console.error(e)
    }
  });

  // 每个 instance 自带 baseURL；401 retry 必须回到「触发错误的那个 instance」
  bindAuthInterceptors(clientApi.instance)
  bindAuthInterceptors(adminApi.instance)
  bindAuthInterceptors(gatewayApi.instance)

});
