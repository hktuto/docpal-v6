<template>
  <div>loading</div>
</template>
<script lang="ts" setup>
import { allMenuItem, getMenuItemByComponent } from '#imports'

const route = useRoute()
const router = useRouter()
const preference = useUserPreference()

async function openTab(path: string, queryObject: any) {
  const allMenu: any = allMenuItem
  const isAdmin = path.includes('admin/') ? 'admin' : 'client'
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
  const menuSetting = getMenuItemByComponent(menuItem.component)
  if (!menuSetting) {
    await router.push('/')
    return
  }

  // TODO: 有機率遇到 preference.value沒有獲取到導致後續無法進行
  if (!preference.value) {
    preference.value = {}
    console.log("preference.value Undefined")
    await router.push('/')
    return
  }
  if (!preference.value.userStoreTab) {
    preference.value.userStoreTab = {
      client: '',
      admin: ''
    }
  }

  nextTick(() => {
    const userStoreTab = preference.value.userStoreTab

    const storageTabs = userStoreTab[isAdmin] || null
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
            menuItem.initized = true
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
    preference.value.userStoreTab[isAdmin] = JSON.stringify(newLayout)
  })

  if (isAdmin === 'admin') {
    await router.push('/admin')
  } else {
    await router.push('/')
  }
}

onMounted(async () => {
  try {
    await openTab(route.path.replace(/^\/|\/$/g, '').toLowerCase(), route.query)
  } catch (e) {
    console.log('..all', e)
  }
})
</script>
