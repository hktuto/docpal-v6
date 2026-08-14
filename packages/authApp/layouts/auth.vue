<script lang="ts" setup>
import { TabApp } from "#components";
import { newClientApi } from 'api'
import { useDebounceFn } from '@vueuse/core'
const {public : { platform }} = useRuntimeConfig()
const localeReady = ref(false)
const appPlatform = useAppPlatform()
const defaultTab = useAppDefaultTab()


const tabAppRef = useTemplateRef<typeof TabApp>('tabAppRef');
const emits = defineEmits(["ready"]); 

const { globalSlots } = useGlobalSetting();

const config = useAppConfig()


const inited = ref(false)
const preference = useUserPreference()
async function getTabsFromServer() {
  // check if new tab
  
  if(inited.value) return
  
  const userStoreTab = preference.value.userStoreTab
  
  let storageTabs = userStoreTab ? userStoreTab[appPlatform.value] : null
  try {
    if (storageTabs) {
      
      const newLayout = JSON.parse(storageTabs);
      // check and set layout
      newLayout.forEach((item:any) => {
        const tabId = item.id;
        item.tabs.forEach((child:any) => {
          child.parent = tabId
        })
      })
      // TODO : check if storageTabs is array, and handle restore other tabs
      tabAppRef.value?.setLayout(newLayout);
    } else {
      // init a basic layout
      tabAppRef.value?.setHightLightPanel("dummy-tab-container");
      const _defaultTab = JSON.parse(JSON.stringify(defaultTab.value))
      _defaultTab.parent = "dummy-tab-container";
      tabAppRef.value?.setLayout([
        {
          id: "dummy-tab-container",
          parent: "root",
          showingTabIndex: 0,
          size: 100,
          tabs: [_defaultTab],
        },
      ]);
      console.log("set default tab");
    }
  } catch (error) {
    tabAppRef.value?.setLayout([
      {
        id: "dummy-tab-container",
        parent: "root",
        showingTabIndex: 0,
        size: 100,
        tabs: [defaultTab.value],
      },
    ]);
  } finally {
    inited.value = true
    const route = useRoute()
    const hasQuery = Object.keys(route.query || {}).length > 0
    const hasHash = !!route.hash
    if (hasQuery || hasHash) {
      useRouter().replace({ path: route.path, hash: '', query: {} })
    }
  }
  
}

function saveHighlightPanel(panelID: string) {
  const tabStorageKey = appPlatform.value + '-app-hightLightPanel'
  
  localStorage.setItem(tabStorageKey, panelID);
}

async function persistTabsLayout(layout: TabPanel[]) {
  const saveData = JSON.parse(JSON.stringify(layout));

  // loop all panel and tabs to reset all initized to false
  saveData.forEach((panel: any) => {
    panel.tabs.forEach((tab: any) => {
      tab.initized = false;
    });
  });
  if(!preference.value.userStoreTab) {
    preference.value.userStoreTab = {}
  }
  preference.value.userStoreTab[appPlatform.value] = JSON.stringify(saveData)
  await newClientApi.putDmsUserSetting(preference.value as any)
}

/** 初始化阶段跳过；之后短时间多次 layout 变更合并为一次 PUT */
const persistTabsLayoutDebounced = useDebounceFn((layout: TabPanel[]) => {
  return persistTabsLayout(layout)
}, 400)

function saveTabsToLocalStorage(layout: TabPanel[]) {
  if (!inited.value) return
  persistTabsLayoutDebounced(layout)
}

const { t } = useI18n();
// onMounted(async () => {
//   await getLocale();
//   // emits("ready");
// });
</script>


<template>
  <AuthState>
    <template #default="{ loggedIn, logout }">
      <TabApp 
        ref="tabAppRef"
        @ready="getTabsFromServer"
        @layoutChanged="saveTabsToLocalStorage"
        @highlightPanelChanged="saveHighlightPanel"
      >
        <template #sidebar>
          <slot name="sidebar" />
          <component
            v-for="s in globalSlots"
            v-show="s.show"
            :key="s.name"
            :is="s.component"
            v-bind="$props"
          /> 
        </template>
      </TabApp>
    </template>
    <template #placeholder>
      <LoadingBg>
        <h1 style="color: #fff">{{ $t('loading') }}</h1>
      </LoadingBg>
    </template>
  </AuthState>
</template>

