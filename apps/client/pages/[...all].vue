<template>
  <div>loading</div>
</template>
<script lang="ts" setup>
import { allMenuItem, getMenuItemByComponent } from '#imports'

const route = useRoute()
const router = useRouter()
const appPlatform = useAppPlatform()
const preference = useUserPreference()

async function openTab(path: string, queryObject: any) {
  const allMenu: any = allMenuItem
  const isAdmin = appPlatform.value === 'admin' ? 'admin' : 'client'
  let menuItem = allMenu[path]

  // 不存在的路徑一律返回 home
  if (!menuItem) {
    menuItem = {
      id: 'client-work-panel',
      name: 'client-work-panel',
      label: 'adminMenu.workPanel',
      icon: 'material-symbols:home',
      hoverIcon: 'material-symbols:home',
      component: 'LazyHomePage',
      feature: 'DASHBOARD',
      handleError: true,
      props: {}
    }
  } else {
    menuItem = await menuItem.createRouteItem(queryObject)
  }
  const menuSetting = await getMenuItemByComponent(menuItem.component)
  const userStoreTab = preference.value.userStoreTab
  const storageTabs = userStoreTab.client || null
  let newLayout: any

  if (storageTabs) {
    newLayout = JSON.parse(storageTabs)
    let openNewTab = false
    outerLoop: for (let layoutIndex = 0; layoutIndex < newLayout.length; layoutIndex++) {
      const layoutItem = newLayout[layoutIndex]
      for (let tabIndex = 0; tabIndex < layoutItem.tabs.length; tabIndex++) {
        const tabItem = layoutItem.tabs[tabIndex]
        // 不存在路由中
        if (tabItem.component !== menuItem.component) {
          openNewTab = true
          continue
        }

        // 是否替換tab的數據
        if (menuSetting.shouldReplace(tabItem, menuItem)) {
          openNewTab = false
          layoutItem.tabs[tabIndex] = menuItem
          preference.value.userStoreTab[isAdmin] = JSON.stringify(newLayout)
          break outerLoop
        } else {
          openNewTab = true
        }
      }
    }

    // open new Tab
    if (openNewTab) {
      const lastItem = newLayout[newLayout.length - 1]
      lastItem.showingTabIndex = lastItem.tabs.length
      lastItem.tabs.push({
        ...menuItem,
        parent: lastItem.id,
        initized: true
      })
      localStorage.setItem('app-tab-hightLightPanel', lastItem.id)
    }
  } else {
    const id = `dummy-tab-container-${Date.now()}`
    newLayout = [
      {
        id: id,
        parent: 'root',
        showingTabIndex: 0,
        size: 100,
        tabs: [{ ...menuItem, parent: id }]
      }
    ]
    localStorage.setItem('app-tab-hightLightPanel', id)
  }

  if (!preference.value.userStoreTab) {
    preference.value.userStoreTab = {
      client: '',
      admin: ''
    }
  }
  preference.value.userStoreTab[isAdmin] = JSON.stringify(newLayout)
  await router.push('/')
}

onMounted(async () => {
  // step1 normalize route path by removing trailing slash
  // const temPath = sessionStorage.getItem('temp-path')
  // if (!!temPath) {
  //   router.push('/')
  //   return
  // }

  // const path = route.path.replace(/\/$/, '')
  // sessionStorage.setItem('temp-path', path)
  try {
    await openTab(route.path.replace(/^\/|\/$/g, ''), route.query)
  } catch (e) {
    console.log(e)
  }
})
</script>
