import { defineNuxtPlugin, useAuth,  } from '#imports';
import { clientApi, adminApi } from 'api';
import Keycloak from 'keycloak-js';
import { requestSuccessHelper, requestErrorHelper, responseSuccessHelper, responseErrorHelper } from '~/utils/axiosResponseHelper';

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

  // set refresh token to clientApi and adminApi
  clientApi.instance.interceptors.request.use(
    (config) => requestSuccessHelper(config, clientApi.instance),
    (error) => requestErrorHelper(error, clientApi.instance)
  );
  clientApi.instance.interceptors.response.use(
    (config) => responseSuccessHelper(config, clientApi.instance),
    (error) => responseErrorHelper(error, clientApi.instance)
  );
  adminApi.instance.interceptors.request.use(
    (config) => requestSuccessHelper(config, adminApi.instance),
    (error) => requestErrorHelper(error, adminApi.instance)
  );
  adminApi.instance.interceptors.response.use(
    (config) => responseSuccessHelper(config, adminApi.instance),
    (error) => responseErrorHelper(error, adminApi.instance)
  );

});
