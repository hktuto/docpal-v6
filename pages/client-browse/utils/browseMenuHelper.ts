export type BrowseListPageParams = {
    idOrPath: string,
    [key:string]: any
}
export function createBrowseListPageParams(params:BrowseListPageParams){
    return {
        id: 'client-browse' + new Date().getTime(),
        name: 'client-browse-' + params.idOrPath,
        icon: 'dp-icon:browse-outline',
        hoverIcon: 'dp-icon:browse-fill',
        label: "file_browse",
        component: "LazyBrowsePage",
        props:{
            idOrPath: params.idOrPath,
            ...params,
            filter:{}
        }
    }
}
export type BrowseDetailPageParams = {
    idOrPath: string,
    docName: string,
    showHeaderAction?: boolean,
    [key:string]: any
}
export function createDetailPageParams(params:BrowseDetailPageParams){
    return {
        id: 'client-browse-detail' + '-' + params.idOrPath,
        name: 'client-browse-detail' + '-' + params.idOrPath,
        label: params.docName,
        component: 'LazyBrowseDetail',
        props: {
            ...params
        }
    }
}

export function createBrowseWatermarkPageParams(params:BrowseDetailPageParams){
    const {docId, docName} = params
    return {
        id: 'client-browse-watermark' + '-' + docId,
        name: 'client-browse-watermark' + '-' + docName,
        label: docName,
        component: 'LazyBrowseWatermark',
        props: {
            ...params
        }
    }
}

type SharePageParams = {
    backPath: string
}
export const createSharePageParams = (params:SharePageParams) => {
    return {
        id: 'client-share',
        name: 'client-share',
        icon: 'lucide:file-share',
        hoverIcon: 'lucide:file-share',
        label: "share.shareQueue",
        component: "LazyBrowseShare",
        props: {
            ...params
        }
    }
}

export const createUploadRequestDetailParams = (params:any) => {
    return {
        id: 'client-fileRequest-' + params.id,
        name: 'client-fileRequest' + params.id,
        icon: 'uil:upload',
        label: "file_uploads",
        component: "LazyUploadRequestDetail",
        props: {
            ...params,
            id: params.id
        }
    }
}


export const createUploadRequestPageParams = (params:any) => {
    return {
        id: 'client-fileRequest',
        name: 'client-fileRequest',
        icon: 'icon-park-outline:layers',
        hoverIcon: 'icon-park-twotone:layers',
        label: "file_uploads",
        component: "LazyUploadRequestPage",
        props: {
            ...params,
        }
    }
}

type VersionComparisonPageParams = {
    name: string,
    id: string,
    oldVersionNum: string,
}
export const createVersionComparisonPageParams = ({id, name, oldVersionNum}:VersionComparisonPageParams) => {
    return {
        id: 'client-versionComparison',
        name: 'client-versionComparison',
        icon: 'lucide:file-diff',
        hoverIcon: 'lucide:file-diff',
        label: name,
        component: "LazyBrowseVersionComparison",
        props: {
            id,
            name,
            oldVersionNum
        }
    }
}
