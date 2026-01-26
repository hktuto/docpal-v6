
import {clientApi} from 'api'
type DocumentSetting = {
    fileType: string[]
    meta: string,
    related:string[],
    label: string,
    isRoot: boolean,
    isFolder: boolean
} 

export const useRelatedFolder =() => {

    const docTypes = useState<{[key:string] :DocumentSetting}>('docTypes', () => ({}) );
    async function getItem(meta:any) {
        // await getSetting()
        const parentKey = meta.parentKey
        if(parentKey){
            delete meta.parentKey
        }
        return await clientApi.api.postNuxeoDocumentSearchbyproperties(meta)
        .then(res => res.data.data)
        .then( data => data.map(i => {
            if(i.type === 'vendor'){
                i.isFolder = true;
            }
            return i
         })
        )
    }

    async function getItemsByMeta(doc:any, setting:any):Promise<Document[]> {
        if (!setting.meta) return []
        const parentKey = setting.meta.parentKey
        const params = {
            ['dpa:docpalType']: setting.type,
            [setting.meta as string]: doc.properties[setting.meta]
        }
        const response = await getItem(params)
        return response.map((item:any) => ({ ...item }))
    }

    async function getRelatedChild(doc:any) {
        const returnObject:any[] = []
        try{
            // TODO 缺少新API
            const relatedList = await clientApi.api.getTypesNameNameRelated(doc.type).then(res => res.data)
            const pList: any = []
            relatedList.forEach((item: { metaData: string, rootDocPalType: string }) => {
                pList.push(getRelatedDocs(item))
            })
            await Promise.all(pList);
        } catch(e) {
            console.error(e)
        }
        return returnObject 
        async function getRelatedDocs(meta: { metaData: string, rootDocPalType: string }) {
            const data = await getItemsByMeta(doc, {
                meta: meta.metaData,
                type: meta.rootDocPalType
            })
            returnObject.push({
                name: $i18n.t(meta.rootDocPalType),
                children: data
            })
        }
    }
    async function getRelated(doc: any) {
        if(!doc ||!doc.type) return []
        const allChildren = await getRelatedChild(doc)
        return allChildren
    }

    return {
        docTypes,
        getRelated,
    }
}