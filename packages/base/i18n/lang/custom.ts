import {useNuxtApp, defineI18nLocale} from '#imports'

import { clientApi } from 'api'

export default defineI18nLocale(async(locale:string) => {
    console.log('?????customcustom?????', locale);
    
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
    const {data} = await clientApi.api.getDmsFormPropertiesLanguageList({
        locale,
        languageKey:'admin'
    })
    if(data && data.length > 0 && data[0].languageContent) {
        return JSON.parse(data[0]?.languageContent)
    }
    return {}
  })