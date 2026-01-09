import { clientApi } from "api"
import zhCN from 'vxe-table/lib/locale/lang/zh-CN'
import enUS from 'vxe-table/lib/locale/lang/en-US'
import zhHK from 'vxe-table/lib/locale/lang/zh-HK'
export const useLoadState = () => useState<string>(() => 'Init');
export const initPublicLayout = async () => {
  const loadState = useLoadState()

  // load language
  const navigatorLanguage = navigator.language
  let resultLanguage = 'en-US'
  if (navigatorLanguage === 'zh-HK') resultLanguage = 'zh-HK'
  else if (navigatorLanguage.includes('zh')) resultLanguage = 'zh-CN'
  try {
    loadState.value = await getLocale(resultLanguage)
  } catch (e) {
    console.log(123)
    console.error(e)
  }

  setTimeout(() => {
    loadState.value = 'Ready'
  }, 3000)
}
export async function getLocale(curLocale: string = 'en-US') {
  // @ts-ignore
  const { locale, availableLocales, setLocaleMessage, setLocale } = useI18n()
  await Promise.all(availableLocales.map(async (code) => {
    const vxeLang = code === 'zh-CN' ? zhCN : code === 'en-US' ? enUS : zhHK
    const { data: clientData } = await clientApi.api.getDmsFormPropertiesLanguageList({
      locale: code,
      languageKey: 'client'
    }) as any
    const clientJson = JSON.parse(clientData[0].languageContent)
      console.log('loading-1',clientJson)
    const { data: adminData } = await clientApi.api.getDmsFormPropertiesLanguageList({
      locale: code,
      languageKey: 'admin'
    }) as any
    const adminJson = JSON.parse(adminData[0].languageContent)
      console.log('loading-2',adminJson)
    const { data: metaData } = await clientApi.api.getDmsFormPropertiesLanguageList({
      locale: code,
      languageKey: 'meta'
    }) as any
    const metaJson = JSON.parse(metaData[0].languageContent)
      console.log('loading-2',metaJson)
    setLocaleMessage(code, {
      ...clientJson,
      ...adminJson,
      ...metaJson,
      ...vxeLang
    })

  })
  )
  setLocale(curLocale)
  return 'Language ready'
}
