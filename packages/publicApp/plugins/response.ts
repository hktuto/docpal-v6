import {defineNuxtPlugin} from '#imports'
import {clientApi, adminApi} from 'api'
import {requestSuccessHelper, requestErrorHelper, responseSuccessHelper, responseErrorHelper} from '../utils/axiosResponseHelper'

export default defineNuxtPlugin(async () => {
    // set refresh token to clientApi and adminApi
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
