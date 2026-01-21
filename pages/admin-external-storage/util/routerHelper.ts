export const routeExternalStorageDetailPage  = function(params: any){
  return {
    id: "external-storage-detail-versions-" + new Date().getTime(),
    name: "external-storage-detail-versions-" + params.id,
    icon: 'dp-icon:flow-outline',
    label: params.name,
    component: 'LazyExternalStorageDetail',
    props: {
      id: params.id,
      host: params.credentials.host
    }
  } as TabItem
}
export const routeExternalStorageProfileDetailPage  = function(params: any){
  return {
    id: "external-storage-profile-detail-versions-" + new Date().getTime(),
    name: "external-storage-profile-detail-versions-" + params.id,
    icon: 'dp-icon:flow-outline',
    label: params.name,
    component: 'LazyExternalStorageProfileDetail',
    props: {
      id: params.id,
      storageId: params.storageId
    }
  } as TabItem
}
