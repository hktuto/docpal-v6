import { clientApi } from 'api'
export const localeKeys = ['en-US', 'zh-CN', 'zh-HK']
export async function getMetaI18n(lKey: string) {
  const languages = await getMetaLanguageList()

  const result = {}
  for (const locale of localeKeys) {
    try {
      result[locale] = languages[locale].languages[lKey]
      if (!result[locale]) throw new Error('no key')
    } catch (error) {
      result[locale] = lKey
    }
  }
  return result
}
let languageListMap: any = {}
export async function getMetaLanguageList(languageKey: string = 'meta') {
  if (languageListMap['en-US']) return languageListMap
  let pList: any = []
  for (const locale of localeKeys) {
    pList.push(
      clientApi.api
        .getDmsFormPropertiesLanguageList({
          locale,
          languageKey
        })
        .then((res) => res.data[0])
    )
  }
  const pResult = await Promise.all(pList)
  const result = {}
  pResult.forEach((data) => {
    const lanJson = JSON.parse(data.languageContent)
    const languages = flattenJSON(lanJson, {})
    result[data.locale] = {
      ...data,
      languages
    }
  })
  languageListMap = result
  return result

  // 去链化
  function flattenJSON(obj: any = {}, res: any = {}, extraKey = '') {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] !== 'object') {
        if (!res[extraKey + key]) res[extraKey + key] = {}
        res[extraKey + key] = obj[key]
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`)
      }
    })
    return res
  }
}

export async function saveMetaI18n(lKey: string, lKeyValueMap: any) {
  const _languageListMap = JSON.parse(JSON.stringify(languageListMap))
  for (const locale of localeKeys) {
    if (_languageListMap[locale].languages[lKey] === lKeyValueMap[locale]) continue
    _languageListMap[locale].languages[lKey] = lKeyValueMap[locale]
    const languages = restoreChainJson(_languageListMap[locale].languages)
    const recordLanguage = _languageListMap[locale].languages // 记录语言，提交成功后替换
    _languageListMap[locale].languageContent = JSON.stringify(languages)
    delete _languageListMap[locale].languages
    try {
      await clientApi.admin.postAdmindmsFormPropertiesLanguage(_languageListMap[locale]).then((r) => r.data)
      languageListMap[locale].languages = recordLanguage
    } catch (error) {}
  }

  // 链化
  function restoreChainJson(json: any) {
    const result = {}
    let _result: any = {}
    Object.keys(json).forEach((key) => {
      const keys = key.split('.')
      _result = result
      keys.forEach((item, index) => {
        if (index === keys.length - 1) {
          _result[item] = json[key]
        } else {
          if (!_result[item]) _result[item] = {}
          _result = _result[item]
        }
      })
    })
    return result
  }
}
