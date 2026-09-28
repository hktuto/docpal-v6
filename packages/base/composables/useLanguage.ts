// import { availableLocales } from 'i18n/makeI18nSetting';
import { newClientApi } from 'api'
import { ElNotification } from 'element-plus'
const availableLocales = [ 'en-US', 'zh-CN', 'zh-HK']
const pageKeys: any = {
    '/trash': ['commons_success', 'Fail', 'trash_error_noAction', 'dpTip_noSelection']
}
const GetLanguageApi = async(locale: string, languageKey: string) => {
    const data: any = await newClientApi.getDmsFormPropertiesLanguageList({locale, languageKey}, {
        headers: { 'noRouteErrorPage' : "true", "noAuth" : "true"  }
    }).then(res=>res.data)
    if(!!data && !!data[0]) return {
        ...data[0],
        languageContent: JSON.parse(data[0].languageContent),
    }
    else return {}
}
const SetLanguageApi = async(params: any) => {
    return await newClientApi.postDmsFormPropertiesLanguage(params).then(res=>res.result)
}
export const useLanguage = () => {
    const ignoreList:string[] = ['en-US', 'zh-CN', 'zh-HK']
    const route = useRoute()
    const languageKeys = new Set<string>()
    const localeSectionKeys = 'meta,client'.split(',');
    const i18n: any = useNuxtApp().$i18n

    const languageStores = new Map();
    const languageKeysStores = new Map();
    // 步骤1：添加key
    function addLanguageKeys (key: string) {
        languageKeys.add(key)
    }
    // 步骤2：获取过滤ignoreList的key列表
    function getLanguageKeys () {
        const list = [...languageKeys]
        if(!!pageKeys[route.path]) list.push(...pageKeys[route.path])
        return list.filter(key => !ignoreList.includes(key) && key)
    }
    // 步骤3：获取key的翻译列表
    async function getLanguageList (keys: string[], localeSectionKey: string = localeSectionKeys[0]) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (languageKeysStores.size !== 0) {
                    clearInterval(interval)
                    resolve(getResult())
                }
            }, 1000)
        })
        function getResult() {
            return keys.reduce((prev: any[], key: string) => {
                if (!languageKeysStores.has(key)) {
                    const data: any = {
                        key,
                        section: localeSectionKey
                    }
                    availableLocales.forEach(item => {
                        data[item] = key
                    })
                    languageKeysStores.set(key, data)
                }
                prev.push(languageKeysStores.get(key))
                return prev
            }, [])
        }
    }

    /**
     * 异步函数，根据availableLocales和 section 获取语言信息
     * @param availableLocales - [ 'en-US', 'zh-CN', 'zh-HK']
     * @param localeSectionKeys - ['admin', 'mete', 'client']
     */
    async function getLanguageListStore (locales: string[] = availableLocales, sections: string[] = localeSectionKeys) {
        let pList: any = []
        locales.forEach((code: string) => {
            sections.forEach(async(section: string) => {
                pList.push(getLanguage(code, section))
            })
        })
        await Promise.all(pList)
        return [...languageKeysStores.values()]
    }
    async function getLanguage (code:string, section:string) {
        console.log('getLanguage', code, section);

        try {
            const res = await GetLanguageApi(code, section)

            const flattenData = flattenJSON(res.languageContent, {})
            languageStores.set(getStoreKey(code, section), { ...res, _languageContent: flattenData })
            Object.keys(flattenData).forEach((key: string) => {
                if (languageKeysStores.has(key)) {
                    const data = languageKeysStores.get(key)
                    data[code] = flattenData[key]
                } else {
                    languageKeysStores.set(key, {
                        key,
                        [code]: flattenData[key],
                        section
                    })
                }
            })
        } catch (error) {

        }
    }
    function flattenJSON (obj: any = {}, res: any = {}, extraKey = '') {
        Object.keys(obj).forEach(key => {
            if(typeof obj[key] !== 'object'){
            if(!res[extraKey + key]) res[extraKey + key] = {}
                res[extraKey + key] = obj[key];
            }else{
                flattenJSON(obj[key], res, `${extraKey}${key}.`);
            }
        })
        return res;
    }
    function restoreChainJson (json: any) {
        const result = {}
        let _result: any = {}
        Object.keys(json).forEach(key => {
            const keys = key.split('.')
            _result = result
            keys.forEach((item, index) => {
                if(index === keys.length - 1) {
                    _result[item] = json[key]
                } else {
                if(!_result[item]) _result[item] = {}
                    _result = _result[item]
                }
            })
        })
        return result
    }
    function getStoreKey (code:string, section:string) {
        return code + '-' + section
    }
    // 步骤四：保存设置，并且重新加载语言
    async function setLanguageStores (row: any) {
        let pList: any = []
        availableLocales.forEach((code) => {
            const data = languageStores.get(getStoreKey(code, row.section))
            if(data._languageContent[row.key] !== row[code]) {
                data._languageContent[row.key] = row[code]
                pList.push(handleSetLanguage(data, {code, section: row.section, key: row[code]}))
            }
        })

        if (pList.length === 0) return
        let result = await Promise.all(pList)
        const locales: string[] = []
        const sections: string[] = []
        let errorMessage = ''
        result.forEach(item => {
            locales.push(item.code)
            sections.push(item.section)
            if (!item.result) {
                // @ts-ignore
                errorMessage += `${item.code}-${item.key}: ${$i18n.t('dpMsg_error')}<br/>`
            }
        })
        if(errorMessage.length > 0) {
            console.error({errorMessage});
            ElNotification({
                title: '',
                message: errorMessage,
                dangerouslyUseHTMLString: true,
                type: 'error',
                duration: 5000
            });
        }
        // 后端有延时
        await new Promise((resolve:any) => setTimeout(async() => {
            // 仅重加载变更的语言
            await restored(locales, sections)
            resolve()
        }, 800))
    }
    async function restored (locales: string[], sections: string[]) {
        await getLanguageListStore(locales, sections)
        locales.forEach(locale => {
            const newLanguage = {}
            localeSectionKeys.forEach( (section:any) => {
                const data = languageStores.get(getStoreKey(locale, section))
                Object.assign(newLanguage, data.languageContent);
            })
            i18n.setLocaleMessage(locale, newLanguage);
        })
    }
    async function handleSetLanguage (data: any, result: any) {
        try {
            const params = {
                ...data,
                languageContent: JSON.stringify(restoreChainJson(data._languageContent))
            }

            delete params._languageContent
            const res = await SetLanguageApi(params)
            return { ...result, result: res}
        } catch (error) {
            return { ...result, result: false}
        }
    }
    async function loadLanguage(locale: string) {
        console.log('loadLanguage');

        if (locale.includes('en')) locale = 'en-US'
        if (locale.includes('zh') && locale !== 'zh-HK') locale = 'zh-CN'
        if (!i18n.availableLocales.includes(locale)) {
            const jsonKeys = {}

            // @ts-ignore
            for await ( const languageKey of localeSectionKeys) {
                try {
                    const { languageContent } = await GetLanguageApi(locale, languageKey)
                    Object.assign(jsonKeys, languageContent);
                } catch (error) {

                }
            }
            i18n.setLocaleMessage(locale, jsonKeys);
        }
        i18n.setLocale(locale)
    }
    function getAvailableLocales() {
        return availableLocales
    }
    return {
        getAvailableLocales,
        languageKeys,
        languageKeysStores,
        addLanguageKeys,
        getLanguageKeys,

        getLanguageList,
        getLanguageListStore,

        setLanguageStores,
        loadLanguage
    }
}
