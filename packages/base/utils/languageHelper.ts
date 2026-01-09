import enJson from 'deployment/src/en-US.json'
import zhJson from 'deployment/src/zh-CN.json'
import zhHKJson from 'deployment/src/zh-HK.json'
import { clientApi } from 'api'
let localeFinished = false
export async function isLocaleFinished(){
  // console.log('isLocaleFinished');

  // while(!localeFinished){
  //   await new Promise((resolve) => setTimeout(resolve, 100))
  //   console.log('isLocaleFinished', localeFinished);
  // }
  await new Promise((resolve) => setTimeout(resolve, 500))
  return localeFinished
}
export async function getLocale(){
    const { locale, availableLocales, setLocaleMessage, setLocale } = useI18n()
    // if app is not public, then get user preference language

    const config = useRuntimeConfig()
    console.log('getLocale',config.public.platform)
    if(config.public.platform === 'admin' || config.public.platform === 'client'){
      const perference = useUserPreference()
      // check if perference is value and language is not equal to locale
      if(perference.value && perference.value.language && perference.value.language !== locale.value){
        await setLocale(perference.value.language)
      }
    }
    let clientJson;
  console.log('getLocale',config.public.isProduction)
    if(config.public.isProduction){
      const { data:clientData } = await clientApi.api.getDmsFormPropertiesLanguageList({
        locale:locale.value,
        languageKey: 'client'
      }) as any
      console.log("clientData", clientData[0])
        clientJson = JSON.parse(clientData[0].languageContent)
    }else{
        clientJson = locale.value === 'en-US' ? enJson : locale.value === 'zh-CN' ? zhJson : zhHKJson
        // const jsonFile = await fetch(`/defaultLang/${code}.json`).then(res => res.json())
        // clientJson = jsonFile
    }
    const { data:adminData } = await clientApi.api.getDmsFormPropertiesLanguageList({
            locale:locale.value,
            languageKey: 'admin'
        }) as any
    const adminJson = JSON.parse(adminData[0].languageContent)
    const { data:metaData } = await clientApi.api.getDmsFormPropertiesLanguageList({
            locale:locale.value,
            languageKey: 'meta'
        }) as any
    const metaJson = JSON.parse(metaData[0].languageContent)

    setLocaleMessage(locale.value, {
        ...clientJson,
        ...adminJson,
        ...metaJson
    })
    localeFinished = true
}
