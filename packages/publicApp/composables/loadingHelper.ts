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
  loadState.value = await getLocale(resultLanguage)

  setTimeout(() => {
    loadState.value = 'Ready'
  }, 3000)
}
export async function getLocale(curLocale: string = 'en-US') {
  // @ts-ignore
  const { locale, availableLocales, setLocaleMessage, setLocale } = useI18n()
  await Promise.all(availableLocales.map(async (code) => {
    const vxeLang = code === 'zh-CN' ? zhCN : code === 'en-US' ? enUS : zhHK
    const { data: clientData } = await clientApi.api.queryLanguage({
      locale: code,
      languageKey: 'client'
    }) as any
    const clientJson = JSON.parse(clientData[0].languageContent)

    const { data: adminData } = await clientApi.api.queryLanguage({
      locale: code,
      languageKey: 'admin'
    }) as any
    const adminJson = JSON.parse(adminData[0].languageContent)

    const { data: metaData } = await clientApi.api.queryLanguage({
      locale: code,
      languageKey: 'meta'
    }) as any
    const metaJson = JSON.parse(metaData[0].languageContent)
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
