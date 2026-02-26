import enJson from 'deployment/src/en-US.json'
import zhJson from 'deployment/src/zh-CN.json'
import zhHKJson from 'deployment/src/zh-HK.json'
import { newClientApi } from 'api'
let localeFinished = false
export async function isLocaleFinished() {
  // console.log('isLocaleFinished');

  // while(!localeFinished){
  //   await new Promise((resolve) => setTimeout(resolve, 100))
  //   console.log('isLocaleFinished', localeFinished);
  // }
  await new Promise((resolve) => setTimeout(resolve, 500))
  return localeFinished
}
export async function getLocale() {
  console.log('get locale in utils ')
  const { locale, availableLocales, setLocaleMessage, setLocale } = useI18n()
  // if app is not public, then get user preference language

  const config = useRuntimeConfig()
  if (config.public.platform === 'admin' || config.public.platform === 'client') {
    const perference = useUserPreference()
    // check if perference is value and language is not equal to locale
    if (perference.value && perference.value.language && perference.value.language !== locale.value) {
      await setLocale(perference.value.language)
    }
  }
  let clientJson
  if (config.public.isProduction) {
    const { data: clientData } = (await newClientApi.getDmsFormPropertiesLanguageList({
      locale: locale.value,
      languageKey: 'client'
    })) as any
    clientJson = JSON.parse(clientData[0].languageContent)
  } else {
    clientJson = locale.value === 'en-US' ? enJson : locale.value === 'zh-CN' ? zhJson : zhHKJson
    // const jsonFile = await fetch(`/defaultLang/${code}.json`).then(res => res.json())
    // clientJson = jsonFile
  }
  const { data: adminData } = (await newClientApi.getDmsFormPropertiesLanguageList({
    locale: locale.value,
    languageKey: 'admin'
  })) as any
  const adminJson = JSON.parse(adminData[0].languageContent)
  const { data: metaData } = (await newClientApi.getDmsFormPropertiesLanguageList({
    locale: locale.value,
    languageKey: 'meta'
  })) as any
  const metaJson = JSON.parse(metaData[0].languageContent)

  setLocaleMessage(locale.value, {
    ...clientJson,
    ...adminJson,
    ...metaJson
  })
  localeFinished = true
}
