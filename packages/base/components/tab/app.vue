<script setup lang="ts">
import {useEventBus, GlobalPasteEvent } from 'eventbus'
import 'splitpanes/dist/splitpanes.css'
const emits = defineEmits(['ready', 'layoutChanged', 'highlightPanelChanged'])
const {layout, initLayout, allComponents, allComponentRef} = useTabsManager()
const loading = ref(false);
const hightLightPanel = useCurrentTargetPanel()


// #region hot key to close tab
const activeElement = useActiveElement()

const appPlatform = useAppPlatform()


const notUsingInput = computed(() =>
  activeElement.value?.tagName !== 'INPUT'
  && activeElement.value?.tagName !== 'TEXTAREA'
)

const { delete: DELETE } = useMagicKeys()

whenever(logicAnd(DELETE, notUsingInput), () => {
  console.log('Tab has been pressed outside of inputs!')
  // check layout 
  if(layout.value.length !== 1 || layout.value[0].tabs.length !== 1){
    const selectedTab = layout.value.find(panel => panel.id === hightLightPanel.value)
    if(selectedTab){
      closePanelTab(hightLightPanel.value, selectedTab.showingTabIndex as number, true)
    }
  }
})
  // #endregion

const fullscreenItem = ref<TabItem>()

const dialogItem = ref<TabItem>()
const menuStick = ref(true)

const dialogOpened = ref(false)
function closeFullscreen(){
    console.log("close fullscreen")
    fullscreenItem.value = undefined
}
function openFocusMode(tab:TabItem){
    fullscreenItem.value = tab
}
function closeDialog(){
    dialogOpened.value = false
}
function openNewDialog(tab:TabItem){
    dialogOpened.value = true;
    dialogItem.value = tab
}

provide(
    TabManagerKey, 
    {
        fullscreenItem,
        dialogOpened,
        closeDialog,
        openFocusMode,
        openNewDialog,
        openInCurrentTab,
        openTab,
        openInNewTab,
        menuStick,
        toggleMenuStick
    }
)
const appNeedUpdate = useAppNeedUpdate()
async function openTab(tab:TabItem, ignoreFocus:boolean = false){
    if(appNeedUpdate.value) {
        window.location.reload()
        return
    }
    // check if tab is already open
    try{
        if(ignoreFocus) throw new Error("ignoreFocus")
        await focusExistingTab(tab)
    }catch(error){
        addTabInCurrentPanel({...tab})
    } 
}

async function openInNewTab(tab:MenuItem){
  if(appNeedUpdate.value) {
        window.location.reload()
        return
    }
  // check layout have more than one panel
  const sourceData = tab;
  if(layout.value.length === 1){
    const targetData = layout.value[0] as TabPanel
    console.log("openInNewTab", targetData, layout.value)
    addMenuItemToPanel(sourceData, targetData, 'right')
    return
  }
  // if not check current focus panel index
  const panelIndex = layout.value.findIndex(panel => panel.id === hightLightPanel.value)
  if(panelIndex === -1) throw new Error('panel not found')
  const targetTab =  panelIndex === 0 ? layout.value[1]: layout.value[panelIndex -1]
  console.log("openInNewTab", targetTab, sourceData)
  addTabToPanel(targetTab.id, sourceData)
}

function focusExistingTab(tab:TabItem):Promise<void>{
    const existingTab = allComponents.value.find(item => item.name === tab.name)
    if(existingTab){
        const panelIndex = layout.value.findIndex(panel => panel.id === existingTab.parent)
        if(panelIndex !== -1) {
            layout.value[panelIndex].showingTabIndex = layout.value[panelIndex].tabs.findIndex(item => item.name === existingTab.name)
            console.log("focusExistingTab", layout.value[panelIndex].showingTabIndex)
            // if panel is not initized, set it to initized
            if(!layout.value[panelIndex].tabs[layout.value[panelIndex].showingTabIndex].initized) {
                layout.value[panelIndex].tabs[layout.value[panelIndex].showingTabIndex].initized = true
            }
            panelTabFocus(layout.value[panelIndex].id,layout.value[panelIndex].showingTabIndex )

            return Promise.resolve()
        }else{
            return Promise.reject(new Error("can not find index"))
        }
    }else{
        return Promise.reject(new Error("no existingTab"))
    }
}

async function openInCurrentTab(tab:TabItem){
    try{
        await focusExistingTab(tab)
    }catch(error){
        let panel = layout.value.find( panel => panel.id === hightLightPanel.value)
        if(!panel) {
            panel = layout.value[0]
        }
        const tabIndex = panel.showingTabIndex as number
        const highLightItem = panel.tabs[tabIndex]
        if(highLightItem){
            const indexInAllComponent = allComponents.value.findIndex(item => item.id === highLightItem.id)
            if(allComponentRef.value[indexInAllComponent]){
                // allComponents.value[indexInAllComponent] = tab;
                allComponentRef.value[indexInAllComponent].navigateTo(tab)
            }else{
                console.log("can not find component")
                // fallback to open in current tab
                openTab(tab)
            }
        }
           
    }
    // const existingTab = allComponents.value.find(item => item.name === tab.name)
}

function setLayout(layout:TabPanel[]){
    loading.value = true;
    initLayout(layout);
    loading.value = false

    // get tab from router
}

function setHightLightPanel(panelId:string){
    hightLightPanel.value = panelId
}

function toggleMenuStick(){
    menuStick.value = !menuStick.value
    if(!menuStick.value){
        localStorage.setItem('docpal-closeMenu', '1')
    }else{
        localStorage.removeItem('docpal-closeMenu')
    }
}

onMounted(() => {
    const LastMenuClosed = localStorage.getItem('docpal-closeMenu')
    // check if window is small screen, if small screen, set menuStick to false
    if(window.innerWidth <= 768){
        menuStick.value = false
    }else if(LastMenuClosed){
        menuStick.value = false
    }else{
        menuStick.value = true
    }
})

watch(hightLightPanel,(item) => {
    emits('highlightPanelChanged', item)
})

watch(layout, (newVal) => {
    emits('layoutChanged', newVal)
},{
    deep:true
})
const PasteDialogRef = ref();
const copyTabBus = useEventBus(GlobalPasteEvent.TAB_COPY_PATH)
copyTabBus.on((data:any) => {
    console.log("copy tab", data)
    PasteDialogRef.value?.open(data)
})

defineExpose({
    setLayout,
    setHightLightPanel,
    openInCurrentTab,
    openTab,
    openInNewTab
})

/** menu logic */
const { t } = useI18n()
const displayMenu = ref<any[]>([])


const searchList = useGlobalSearchList()

function createSearchItem(item:MenuItem, parentKey?:string,) {
  const { availableLocales, messages } = useI18n()

  const keyword = ['menu'];
  availableLocales.forEach( (code) => {
        const codeMessage = messages.value[code]
        const label = item.label.split('.').reduce((acc, cur) => acc[cur] || "", codeMessage)
        if(label) {
            keyword.push(... label.toLowerCase().split(' '), label)
        }
        // if parentKey is not null, add parentKey to keyword
        if(parentKey) {
            const parentKeyLabel = parentKey.split('.').reduce((acc, cur) => acc[cur] || "", codeMessage)
            if(parentKeyLabel) {
                keyword.push(... parentKeyLabel.toLowerCase().split(' '), parentKeyLabel)
            }
        }
    })
    return {
        keyword:[...new Set(keyword)],
        label: t(item.label),
        icon: item.icon,
        action: () => {
            openInCurrentTab(item)
        }
    }
}

function checkVisible(row: any) {
  // TODO : disable feature by now
  // if(row.feature && row.feature !== 'CORE') {
  //     return allowFeature(row.feature)
  // }
  return true
}
function generateMenu(admin: boolean){
  const  { menu, appMenu, adminMenu } = useAppConfig()
    let result = []
    
    const _appMenu = admin ? deepCopy(adminMenu) : deepCopy(appMenu) // menu list
    const _menu = deepCopy(menu) // menu对象映射
    const menuSearchList:GlobalSearchItem[] = [];
    
    // Recursive function to process menu items and their children
    function processMenuItem(item: any, parentLabel?: string): any | null {
        let menuItem = JSON.parse(JSON.stringify(item));
        
        // If item has name, it's a real page - get full details from _menu
        if(item.name && _menu[item.name]) {
            // TODO : check if menu[item.name] has license
            menuItem = JSON.parse(JSON.stringify(_menu[item.name]));
            if(!checkVisible(menuItem)) {
                return null; // Skip if not visible
            }
            // Add to search list
            // if item is a inline item, skip from search
            if(!menuItem.inlineComponent){
              menuSearchList.push(createSearchItem(menuItem, parentLabel || ""))
            }
            
            // If this item has no children, return it directly without processing children
            if(!item.children || item.children.length === 0) {
                return menuItem;
            }
        } else if(item.label) {
            // If only has label, it's a placeholder/folder - use as-is
            menuItem = JSON.parse(JSON.stringify(item));
        } else {
            return null; // Skip items without name or label
        }
        
        // Process children recursively only if there are children
        if(item.children && item.children.length > 0) {
            const processedChildren = [];
            for(let j = 0; j < item.children.length; j++) {
                const child = processMenuItem(JSON.parse(JSON.stringify(item.children[j])), item.label || parentLabel);

                if(child) {
                    processedChildren.push(child);
                }
            }
            if(processedChildren.length > 0) {
                menuItem.children = processedChildren;
            } else {
                menuItem.children = undefined;
            }
        }
        
        return menuItem;
    }
    
    // Process all top-level menu items
    for(let i = 0; i < _appMenu.length; i++) {
        const processedItem = processMenuItem(_appMenu[i]);
        if(processedItem) {
            result.push(processedItem);
        }
    }
    
    searchList.value.push({
        label: "Menu",
        items: menuSearchList
    })
    return result;
}

onMounted(() => {
  displayMenu.value = generateMenu(appPlatform.value === 'admin')
  
})

watch(appPlatform, () => {
  displayMenu.value = generateMenu(appPlatform.value === 'admin')
})

</script>

<template>
<TabWrapper>
        <template #sidebar>
          <template v-if="!isMobile">
          <AppMenu  class="sideMenu" :menuStyle="menuStyle" :displayMenu="displayMenu">
                <template #header>
                </template>
                <template #footer>
                </template>
            </AppMenu>
            
          </template>
            <AppMenuMobile v-if="isMobile" class="sideMenu"  :displayMenu="displayMenu" />
            <slot name="sidebar"></slot>
        </template>
        <template #default>
            <template  v-if="loading">
                <LoadingBg />
            </template>
            <template v-else>
                <TabLayout :layout="layout" @ready="$emit('ready')" />
                <div class="hiddenAllComponent">
                    <template v-for="component in allComponents" :key="component.id">
                        
                        <template v-if="fullscreenItem && fullscreenItem.id === component.id">
                            <Teleport defer :to="`#fullscreen-${component.parent}_${component.id}`">
                                <TabRouter ref="allComponentRef" :tab="component"  />
                            </Teleport>
                        </template>
                        <template v-else>
                            
                            <Teleport defer :to="`#${component.parent}_${component.id}`">
                                <TabRouter ref="allComponentRef" :tab="component" />
                            </Teleport>

                        </template>
                        
                    </template>
                </div>

                <!-- <div v-if="fullscreenItem" class="fullScreenContainer" >
                    <div class="header" :data-tab-id="fullscreenItem.id" :id="`fullscreen-tab-header-${fullscreenItem.parent}-${fullscreenItem.id}`">
                        <div class="tabLeftTeleportContainer" >

                        </div>
                        <div class="icon"></div>
                        <div class="label">
                            
                        </div>
                        <Icon class="closeIcon" name="ic:round-close" @click.stop="closeFullscreen"></Icon>
                    </div>
                    <div class="fullscreenContent" :id="'fullscreen-' + fullscreenItem.parent + '_' + fullscreenItem.id">
                      
                    </div>
                </div> -->

            </template>
        </template>
    </TabWrapper>
    <TabPastePathDialog ref="PasteDialogRef"  @openInNewTab="(data) => openTab(data, true)" />
</template>


<style lang="scss" scoped>
.fullScreenContainer{
    position: absolute;
    left:0;
    top:0;
    width: 100%;
    height: 100%;
    background: var(--app-grey-950);
    z-index: 1000;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-flow: column nowrap;
    z-index: 4;
    border-radius: var(--app-border-radius-m);
    overflow: hidden;
    .header{
        width: 100%;
        display: flex;
        flex-flow: row nowrap;
        overflow: auto;
        overflow-y:hidden ;
        isolation: isolate;
        position: relative;
        // background: var(--app-grey-900);
        justify-content: flex-start;
        align-items: center;
        padding-block: var(--app-space-xs);
        &:after {
            content: '';
            height: 1px;
            background: var(--app-grey-800);
            width:100%;
            display: block;
            z-index: -1;
            position: absolute;
            left: 0;
            bottom: 0;
        }
    }
    .fullscreenContent{
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: var(--app-grey-950);
    }
}
</style>
