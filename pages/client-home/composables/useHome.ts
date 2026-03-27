import { newClientApi } from 'api'
import { useUserPreference } from '#imports'

export const useHomeList = () => useState<any[]>('homeList', () => [])
export const useCurrentHome = () => useState<any>('currentHome', () => null)

const homeLocalStorageKey = 'client-home-list'

export const useHomePage = () => {
  const homeList = useHomeList()
  const currentHome = useCurrentHome()
  const loading = ref(false)
  const preference = useUserPreference()

  async function getHomeList(force: boolean = false) {
    if (homeList.value.length > 0 && !force) return
    loading.value = true
    try {
      // let personal: any = await newClientApi.getDocpalPersonalLanding().then((res) => res.data)
      let dashboardList: any = await newClientApi.getDocpalPersonalLandingDashboardList().then((res: any) => res.data)
      // if (!personal) personal = {}
      if (!dashboardList) dashboardList = []
      // personal.id = 'PERSONAL'
      // personal.name = 'PERSONAL'
      homeList.value = [ ...dashboardList]
      let storageHomeList = preference.value.userStoreHome
      // TODO : remove PERSONAL
      if (!storageHomeList || storageHomeList === 'PERSONAL' && dashboardList[0]) {
        storageHomeList = dashboardList[0]?.id
      }
      if (storageHomeList) {
        const detail = dashboardList.find((item: any) => item.id.toString() === storageHomeList.toString())
        if (detail) {
          await checkoutDashboard(detail)
        }
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
        dashboardDetail = await newClientApi.getDocpalPersonalLanding().then((res: any) => res.data)
      } else {
        dashboardDetail = await newClientApi.getDocpalPersonalLandingDashboardId(detail.id).then((res: any) => res.data)
      }

      const styleJson = JSON.parse(dashboardDetail.styleJson)
      currentHome.value.layout = Array.isArray(styleJson) ? styleJson : []
    } catch (error) {
      currentHome.value.layout = []
    } finally {
      preference.value.userStoreHome = detail.id
      await newClientApi.putDmsUserSetting(preference.value as any)
      loading.value = false
    }
  }

  onMounted(async () => {
    getHomeList()
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
