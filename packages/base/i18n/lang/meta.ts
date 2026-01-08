import {useNuxtApp, defineI18nLocale} from '#imports'


import { clientApi } from "api"

export default defineI18nLocale(async(locale:string) => {
    const config  = useRuntimeConfig()
    if(config.public.needAuth ){
         // @ts-ignore
        const { loggedIn } = useAuth()
        if(!loggedIn.value){
            return {
            }
        }
    }
    // for example, fetch locale messages from nuxt server
    console.log('meta', locale);
    
    const {data} = await clientApi.api.queryLanguage({
        locale:locale,
        languageKey:'meta'
    })
    if(data && data.length > 0 && data[0].languageContent) {
        return JSON.parse(data[0]?.languageContent)
    }
    return {}
  })