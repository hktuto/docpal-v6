import {defineI18nLocale} from '#imports'
import { newClientApi } from "api"
import zhCN from 'vxe-table/lib/locale/lang/zh-CN'
import enUS from 'vxe-table/lib/locale/lang/en-US'
import zhHK from 'vxe-table/lib/locale/lang/zh-HK'
export default defineI18nLocale(async(locale:string) => {
    const config  = useRuntimeConfig()
    if(config.public.needAuth){
        // @ts-ignore
        const { loggedIn } = useAuth()
        if(!loggedIn.value){
            return {
                loading: "Loading...",
                'en-US':"ENG",
                'zh-CN':'簡',
                'zh-HK':"繁"
            }
        }
    }   
    // for example, fetch locale messages from nuxt server
    console.log('ui', locale);
    
    const data: any = await newClientApi.getDmsFormPropertiesLanguageList({
        locale:locale,
        languageKey:'client'
    }).then(r => r.data)
    if(data && data.length > 0 && data[0].languageContent) {
        const languageContent = JSON.parse(data[0].languageContent)
        if(locale === 'zh-CN') {
            return {
                // ...zhCN,
                ...languageContent
            }
        }else if(locale === 'en-US') {
            return {
                // ...enUS,
                ...languageContent
            }
        }else if(locale === 'zh-HK') {
            return {
                // ...zhHK,
                ...languageContent
            }
        }
    }
    return {}
  })
