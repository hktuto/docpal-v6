export const routeDashboardManageDetail  = function(params: any){
  return {
    id: "admin-dashboard-versions-" + new Date().getTime(),
    name: "admin-dashboard-versions-" + params.id,
    icon: 'material-symbols:dashboard-customize-outline-rounded',
    label: params.name,
    component: 'LazyDashboardManageDetail',
    props: {
      id: params.id,
    }
  } as TabItem
}
export const routePersonalDashboardDetail = function(params: any){
  return {
    id: "admin-personal-dashboard-" + new Date().getTime(),
    name: "admin-personal-dashboard-" + params.id,
    icon: 'carbon:dashboard',
    label: params.name,
    component: 'LazyPersonalDashboardManageDetail',
    props: {
      id: params.id,
    }
  } as TabItem
}