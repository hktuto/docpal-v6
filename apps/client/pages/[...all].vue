<template>
  <div>loading</div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

let index = 0
const route = useRoute()
const router = useRouter()
const appPlatform = useAppPlatform()
const preference = useUserPreference()

async function openTab(tabItem: any) {
  const userStoreTab = preference.value.userStoreTab
  const storageTabs = userStoreTab.client || null
  let newLayout: any
  if (storageTabs) {
    // const id = new Date().valueOf() + index
    newLayout = JSON.parse(storageTabs)
    const lastItem = newLayout[newLayout.length - 1]
    lastItem.showingTabIndex = lastItem.tabs.length
    lastItem.tabs.push({
      ...tabItem,
      parent: lastItem.id,
      initized: true
    })
    localStorage.setItem('app-tab-hightLightPanel', lastItem.id)
    // index++;
  } else {
    newLayout = [
      {
        id: 'dummy-tab-container',
        parent: 'root',
        showingTabIndex: 0,
        size: 100,
        tabs: [{ ...tabItem, parent: 'dummy-tab-container' }]
      }
    ]
    localStorage.setItem('app-tab-hightLightPanel', 'dummy-tab-container')
  }
  if (!preference.value.userStoreTab || !preference.value.userStoreTab.client) {
    preference.value.userStoreTab = {
      client: '',
      admin: ''
    }
  }
  preference.value.userStoreTab.client = JSON.stringify(newLayout)
  await clientApi.api.putUserSetting(preference.value as any)
  router.push('/')
}

onMounted(async () => {
  // step1 normalize route path by removing trailing slash

  const path = route.path.replace(/\/$/, '')
  sessionStorage.setItem('temp-path', path)
  switch (path) {
    case '/browse':
      const idOrPath = (route.query.id || route.query.path || '/') as string
      if (idOrPath) {
        const newTab = createBrowseListPageParams({
          idOrPath: decodeURI(idOrPath)
        })
        openTab(newTab)
      }
      break
    case '/workflow/link':
      const workflowItem = await getWorkflowRoute(
        route.query.processInstanceId as string
      )
      console.log(workflowItem)
      openTab(workflowItem)
      break
    case '/case':
      if (route.query.caseId) {
        const caseInstance = await clientApi.api.getCaseInstanceCaseidCaseid(route.query.caseId).then((res) => res.data)
        const newItem = caseManageDashboardPage({
          instanceId: route.query.caseId,
          versionId: caseInstance?.cmmnVersionId
        })
        openTab(newItem)
      }
      break
    default:
      router.push('/')
  }
})
</script>
