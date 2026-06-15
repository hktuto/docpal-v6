export const routeDocDetail  = function(params: any){
  return {
    id: "admin-document-type-versions-" + new Date().getTime(),
    name: "admin-document-type-versions-" + params.id,
    icon: 'material-symbols:dynamic-form-outline-rounded',
    label: params.name,
    component: 'LazyDocTypeDetail',
    props: {
      name: params.name,
      id: params.id,
      metadataName: params.metadataName
    }
  } as TabItem
}
export const routeSmartFolderDetail  = function(params: any){
  return {
    id: "admin-smart-folder-versions-" + new Date().getTime(),
    name: "admin-smart-folder-versions-" + params.id,
    icon: 'fluent:folder-people-24-regular',
    label: params.name,
    component: 'LazyAdminSmartFolderDetail',
    props: {
      id: params.id,
    }
  } as TabItem
}
