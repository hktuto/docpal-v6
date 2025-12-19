<template>
  <div>loading</div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api';
let index = 0;
const route = useRoute();
const router = useRouter();
const appPlatform = useAppPlatform()
const tabName = appPlatform.value + '-app-tab'
function openTab(tabItem: any) {
  let storageTabs = localStorage.getItem(tabName);
  let newLayout: any = [];
  if (storageTabs) {
    // const id = new Date().valueOf() + index
    newLayout = JSON.parse(storageTabs);
    const lastItem = newLayout[newLayout.length - 1]
    lastItem.showingTabIndex = lastItem.tabs.length
    lastItem.tabs.push({
      ...tabItem,
      parent: lastItem.id,
      initized: true,
    });
    localStorage.setItem("app-tab-hightLightPanel", lastItem.id);
    // index++;
  } else {
    newLayout = [
      {
        id: "dummy-tab-container",
        parent: "root",
        showingTabIndex: 0,
        size: 100,
        tabs: [{ ...tabItem, parent: "dummy-tab-container" }],
      },
    ];
    localStorage.setItem("app-tab-hightLightPanel", 'dummy-tab-container');
  }
  localStorage.setItem(tabName, JSON.stringify(newLayout));

  router.push("/");
}
onMounted(async () => {
  // step1 normalize route path by removing trailing slash
  const temPath = sessionStorage.getItem('temp-path')
  if(temPath) {
    router.push("/");
    return;
  }
  const path = route.path.replace(/\/$/, "");
  sessionStorage.setItem('temp-path', path)
  switch (path) {
    case "/browse":
      const idOrPath = (route.query.id || route.query.path || "/") as string;
      if(idOrPath){
        const newTab = createBrowseListPageParams({
          idOrPath: decodeURI(idOrPath),
        });
        openTab(newTab);
      }
      break;
    case "/workflow/link":
      const workflowItem = await getWorkflowRoute(
        route.query.processInstanceId as string
      );
      openTab(workflowItem);
      break;
    case "/case":
      if(route.query.caseId) {
        const caseInstance = await clientApi.api.getCaseInstanceCaseidCaseid(route.query.caseId).then((res) => res.data)
        const newItem = caseManageDashboardPage({
          instanceId: route.query.caseId,
          versionId: caseInstance?.cmmnVersionId
        })
        openTab(newItem);
      }
      break;
    default:
      router.push("/");
  }
});
</script>
