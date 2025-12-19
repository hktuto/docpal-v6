import { clientApi } from 'api'

export const useHomeList = () => useState<any[]>('homeList', () => [])
export const useCurrentHome = () => useState<any>('currentHome', () => null)

const homeLocalStorageKey = 'client-home-list'

export const useHomePage = () => {
  const homeList = useHomeList()
  const currentHome = useCurrentHome()
  const loading = ref(false)
  const preference = useUserPreference()
  async function getHomeList(force: boolean = false) {
    if(homeList.value.length > 0 && !force) return
    loading.value = true
    try{
      let personal: any = await clientApi.api.getPersonalLanding().then((res) => res.data)
      let dashboardList: any = await clientApi.api.getPersonalLandingDashboardList().then((res: any) => res.data)
      if (!personal) personal = {}
      if (!dashboardList) dashboardList = []
      personal.id = 'PERSONAL'
      personal.name = 'PERSONAL'
      homeList.value = [personal, ...dashboardList]
      const storageHomeList = preference.value.userStoreHome
      if(storageHomeList && storageHomeList !== 'PERSONAL') {
        const detail = dashboardList.find((item: any) => item.id.toString() === storageHomeList.toString())
        if(detail) {
          await checkoutDashboard(detail)
        }else{
          await checkoutDashboard(personal)
        }
      }else{
        await checkoutDashboard(personal)
      }
    } catch (error) {
      console.error(error)
    } finally {
    loading.value = false
    }
  }
  async function checkoutDashboard(detail: any) {
    loading.value = true
    currentHome.value = deepCopy(detail)
    try {
      let dashboardDetail: any
      if (detail.id === 'PERSONAL') {
        dashboardDetail = await clientApi.api.getPersonalLanding().then((res: any) => res.data)
      } else {
        dashboardDetail = await clientApi.api.getPersonalLandingDashboardId(detail.id).then((res: any) => res.data)
      }
    
      const styleJson = JSON.parse(dashboardDetail.styleJson)
      currentHome.value.layout = Array.isArray(styleJson) ? styleJson : []
    } catch (error) {
      currentHome.value.layout = []
    } finally {
      preference.value.userStoreHome = detail.id
      await clientApi.api.putUserSetting(preference.value as any)
      loading.value = false
    }
  }

  onMounted(async () => {

    // getHomeList()
    // routerProvider?.refeshActions.value.push(getDashboardList)
  })
  
  return {
    homeList,
    currentHome,
    loading,
    getHomeList,
    checkoutDashboard
  }
}
