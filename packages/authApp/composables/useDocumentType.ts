import { newClientApi } from 'api'

export type MetaSetting = {
    documentType?: string,
    isFolder?: boolean,
    displayMeta?: MetaRule[],
    related?: RelatedMetaDoc[],
    mappingMeta?: any,
    bulkImportConfigs?: string []
}

export type RelatedMetaDoc = {
    meta: string,
    type: string,
    visible?: boolean
}

export type MetaRule = {
    id?: string,
    documentType?: string,
    metaData?: string,
    length?: string,
    isRequire?: boolean,
    vocabulary?: string,
    display?: boolean,
    creatorId?: string,
    creatorName?: string,
    modifiedName?: string,
    modifiedId?: string
}

export type AllMetadataSetting = {
    [key: string]: MetaSetting
}

export const useAllMetadataSetting = () => useState<Record<string, object>>('allMetadataSetting',() => ({}))

export const useDocumentType = () => {
    const allMetadataSetting = useAllMetadataSetting()

    async function getMetaSetting(documentType: string) {
        const setting = allMetadataSetting.value[documentType]
        if (setting) {
            return {
                ...setting,
                name: documentType,
            }
        }   
        const res = await newClientApi.getDmsSettingSystem('')
        if(res && res.data){
            allMetadataSetting.value = res.data
        }
        if(allMetadataSetting.value[documentType]){
            return {
                ...allMetadataSetting.value[documentType],
                name: documentType,
            }
        }
        return {
            displayMataTags:[],
            related:[],
        }
    }

    return {
        getMetaSetting,
    }

}