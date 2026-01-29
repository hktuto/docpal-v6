
export type SimplifiedDocDetail = {
    id: string,
    name: string,
    path: string,
    isFolder: boolean,
    modifiedDate: string,
    createdDate: string,
    mimeType: string,
    documentType: string,
    contributors: string[],
    tags: string[],
    version: string,
    collections: string[]
}
const useShareList = () => useState<SimplifiedDocDetail[]>('share-state', () => ([]))
export const useShareStore = () => {
    const shareList = useShareList()

    async function getMineTypeShareList() {
        // const data = await DocumentThumbnailListGetApi(state.shareList.map((item:any) => item.id))
        return shareList.value.map((item:any) => {
            if(!item.mimeType && item.properties['file_content']['mime-type']) item.mimeType = item.properties['file_content']['mime-type']
            return {...item, readOnly: true}
        })
    }
    function updateShareList(list: SimplifiedDocDetail[]) {
        shareList.value = [...list]
        sessionStorage.setItem('shareList', JSON.stringify(shareList.value))
    }
    function addToShareList(list: SimplifiedDocDetail[], className?: string) {
        if(!shareList.value) shareList.value = []
        list.forEach(item => {
            if(shareList.value.findIndex(i => {
                if(item.isFolder) return -1
                return i.id === item.id
            }) === -1) shareList.value.push(item)
        })
        sessionStorage.setItem('shareList', JSON.stringify(shareList.value))
    }

    function getUseWatermark(mimeType :string) {
        // check mintype is image, pdf or video
        return mimeType.includes('image') || mimeType.includes('pdf') || mimeType.includes('video')
    }
    onMounted(() => {
        const data = sessionStorage.getItem('shareList')
        if(!!data) shareList.value = JSON.parse(data)
    })
    return {
        getUseWatermark,
        getMineTypeShareList,
        updateShareList,
        addToShareList,
        shareList
    }
}
