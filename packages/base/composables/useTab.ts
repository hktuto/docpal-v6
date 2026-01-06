import { useState } from '#imports'
import type { MenuItem } from '#imports'
import type { TabItem, TabPanel } from '../utils/tabType'

export const useTabLayout = () => useState<TabPanel[]>('tabs', () => ([]))
export const useDropEventCallback = () => useState<Record<symbol, any>>('tab-panel-drop-event-callback', () => ({}))
export const useCurrentTargetPanel = () => useState<string>('tab-current-target-panel', () => '')
export const useTabComponent = () => useState<TabItem[]>('tab-component', () => ([]))
export const useCurrentTargetRouter = () => useState<string>('tab-current-target-router', () => '')
export const useAllComponentRef = () => useState('all-component-ref', () => ([]))
export const useTabsManager = () => {
    const layout = useTabLayout()
    const allComponents = useTabComponent()
    const allComponentRef = useAllComponentRef()
    const hightLightPanel = useCurrentTargetPanel()
    function initLayout(newLayout:TabPanel[]) {
        
        layout.value = newLayout
        nextTick(() => {
            hightLightPanel.value = localStorage.getItem('app-tab-hightLightPanel') || newLayout[0].id
            allComponents.value = newLayout.reduce((prev:TabItem[], panel:TabPanel) => {
                return prev.concat(panel.tabs)
                }, [])
              // focus on panels  
              // set initized to all panel selected tab
              //
              layout.value.forEach(panel => {
                if(panel.tabs[panel.showingTabIndex || 0]) {
                    panel.tabs[panel.showingTabIndex || 0].initized = true
                }
              })
        })
        // loop thought layout and push all components

    }

    return {
        allComponents,
        initLayout,
        layout,
        allComponentRef
    }
}

export function panelTabFocus(panelId:string, tabIndex: number) {
    const layout = useTabLayout()
    const hightLightPanel = useCurrentTargetPanel()
    // get panel index useing panelId
    const panelIndex = layout.value.findIndex(tab => tab.id === panelId)
    hightLightPanel.value = panelId
    if(panelIndex !== -1) {
        layout.value[panelIndex].showingTabIndex = tabIndex;
    }
    // set panel initized
    if(!layout.value[panelIndex].tabs[tabIndex].initized) {
        layout.value[panelIndex].tabs[tabIndex].initized = true
    }
}

export function paneResized(sizes:{min:number, max:number, size:number}[]) {
    const layout = useTabLayout()
    sizes.forEach((size, index) => {
        layout.value[index].size = size.size
    })
}

export function closePanelTab(panelId:string, tabIndex: number | string[], deleteComponent = true) {
    const layout = useTabLayout()
    const components = useTabComponent()
    const panelIndex = layout.value.findIndex(tab => tab.id === panelId)
    // 如果找不到 panel 则返回
    if(panelIndex !== -1) {
        // cannot delete the last tab
        if(components.value.length === 1) return;
        let removeItems = [];
        if(!Array.isArray(tabIndex)) {
          const data = layout.value[panelIndex].tabs[tabIndex]
          removeItems.push(data)
        } else {
          tabIndex.forEach((itemId) => {
            const data = layout.value[panelIndex].tabs.find((tab) => tab.id === itemId)
            removeItems.push(data)
          })
        }
        layout.value[panelIndex].tabs = layout.value[panelIndex].tabs.filter((tab) => !removeItems.includes(tab))
        if(!removeItems || removeItems.length === 0) {
            throw new Error('data not found. tabIndex ' + tabIndex + ' is not correct in ' + panelId)
        };
        if(deleteComponent ){
          removeItems.forEach((item) => {
            const componentIndex = components.value.findIndex((component) => component.id === item.id);
            if(componentIndex !== -1) components.value.splice(componentIndex, 1)
          })
        }

        if(layout.value[panelIndex].tabs.length === 0) {
            layout.value.splice(panelIndex, 1)
            // remove old tab, and set focus to another tab
            const newFocusTab = panelIndex > 0 ? panelIndex -1 : 0;
            panelTabFocus(layout.value[newFocusTab].id, 0)
        }else{
            layout.value[panelIndex].showingTabIndex = tabIndex > 0 ? tabIndex -1 : 0
            const componentIndex = components.value.findIndex( (component:TabItem) => component.id === layout.value[panelIndex].tabs[layout.value[panelIndex].showingTabIndex || 0].id);
            components.value[componentIndex].initized = true
        }
    }else{
        throw new Error(`data not found. tabIndex ${tabIndex} is not correct in ${panelId}`)
    }
}

export function reorderWithEdge(parent:TabPanel, sourceData:TabItem, targetData:TabItem, direction: 'left' | 'right') {
    const layout = useTabLayout()
    const parentId = layout.value.findIndex(tab => tab.id === parent.id)
    const sourceIndex = layout.value[parentId].tabs.findIndex((tabItem) => tabItem.id === sourceData.id);
    layout.value[parentId]?.tabs.splice(sourceIndex, 1);
    // step 2 insert target
    const targetIndex = layout.value[parentId].tabs.findIndex((tabItem) => tabItem.id === targetData.id);
    // if direction is left insert before, if direction is right insert after
    const newItemIndex = direction === 'left' ? targetIndex : targetIndex + 1
    layout.value[parentId]?.tabs.splice(newItemIndex, 0 , sourceData)
    // final focus on source
    nextTick(( ) => {
        panelTabFocus(sourceData.parent as string, newItemIndex)
    })
}

export function moveTabBetweenPanel(sourceData:TabItem, targetData:TabItem, direction: 'left' | 'right') {
    console.log("moveTabBetweenPanel", sourceData, targetData, direction)
    const layout = useTabLayout()
    const allComponents = useTabComponent()
    const sourceParentId = layout.value.findIndex(tab => tab.id === sourceData.parent)
    const targetParentId = layout.value.findIndex(tab => tab.id === targetData.parent)
    if(sourceParentId === targetParentId){
        reorderWithEdge(layout.value[sourceParentId], sourceData, targetData, direction)
        return;
    }
    // if source and target is not the same panel, move source to target
    const sourceIndex = layout.value[sourceParentId].tabs.findIndex((tabItem) => tabItem.id === sourceData.id);
    if(sourceIndex === -1) {
        return
    }
    closePanelTab(sourceData.parent as string, sourceIndex, false)

    const newSourceData = {
        ...sourceData,
        parent: targetData.id,
    }
    const targetIndex = layout.value[targetParentId].tabs.findIndex((tabItem) => tabItem.id === targetData.id);
    const newItemIndex = direction === 'left' ? targetIndex  : targetIndex + 1
    layout.value[targetParentId]?.tabs.splice(newItemIndex, 0 , newSourceData)
    
    // final focus on source
    
    const componentIndex = allComponents.value.findIndex((component) => component.id === newSourceData.id);
    nextTick(() => {
        panelTabFocus(targetData.id, newItemIndex)
    })
}

export function splitViewToDirection(sourceData:TabItem, targetData:TabPanel, direction:  "left" | "right" | 'center') {
        const layout = useTabLayout()
        const allComponents = useTabComponent()
        const sourceParentId = layout.value.findIndex(tab => tab.id === sourceData.parent)
        const targetParentId = layout.value.findIndex(tab => tab.id === targetData.id)

        const sourceIndex = layout.value[sourceParentId].tabs.findIndex((tabItem) => tabItem.id === sourceData.id);
        if(sourceIndex === -1) {
            return
        }
        closePanelTab(sourceData.parent as string, sourceIndex, false)
        // check if targetParentLayout direction match new direction
        
        if(direction === 'center') {
            const currentTargetIndex = layout.value.findIndex(tab => tab.id === targetData.id)
            layout.value[currentTargetIndex].tabs.push(
                {
                    ...sourceData,
                    parent: targetData.id,
                })
                nextTick(() => {
                    panelTabFocus(layout.value[currentTargetIndex].id, layout.value[currentTargetIndex].tabs.length - 1)
                    const component = allComponents.value.find( (component:TabItem) => component.id === sourceData.id)
                    console.log('component in all components', component)
                    if(component) {
                        component.parent = targetData.id;
                        component.initized = true
                    }
                })
        }else{
            const newPanelId = "newPanel-" + new Date().getTime()
            const newData:TabPanel = {
                id: newPanelId,
                parent: targetData.id,
                showingTabIndex: 0,
                tabs: [{
                    ...sourceData,
                    parent: newPanelId,
                    initized: true,
                }]
            }
            const newItemIndex = direction === 'left' ? targetParentId  : targetParentId + 1
            layout.value.splice(newItemIndex, 0 , newData)
            nextTick(() => {
                panelTabFocus(newPanelId, 0)
                const component = allComponents.value.find( (component:TabItem) => component.id === sourceData.id)
                if(component) {
                    component.parent = newPanelId;
                    component.initized = true
                }
                
            })
        }

  // get component and update parent and teleport id
}

export function addMenuItemToPanel(sourceData:MenuItem, targetData:TabPanel, direction:  "left" | "right" | 'center') {
    const layout = useTabLayout();
    const allComponents = useTabComponent();
    const targetParentId = layout.value.findIndex(tab => tab.id === targetData.id)
    const newPanelId = "newPanel-" + new Date().getTime()
    sourceData.id +=  new Date().getTime();

    if(direction === 'center') {
        console.log(targetData)
        layout.value[targetParentId].tabs.push(
            {
                ...sourceData,
                parent: targetData.id,
            })
        nextTick(() => {
            panelTabFocus(layout.value[targetParentId].id, layout.value[targetParentId].tabs.length - 1)
            const component = allComponents.value.find( (component:TabItem) => component.id === sourceData.id)
            if(component) {
                component.parent = targetData.parent;
                component.initized  = true
            }else{
                allComponents.value.push({
                    ...sourceData,
                    parent: targetData.id,
                    initized: true,
                })
            }
        })
    }else{
        const newData:TabPanel = {
            id: newPanelId,
            parent: targetData.id,
            showingTabIndex: 0,
            tabs: [{
                ...sourceData,
                initized: true,
                parent: newPanelId,
            }]
        }
        const newItemIndex = direction === 'left' ? targetParentId  : targetParentId + 1
        layout.value.splice(newItemIndex, 0 , newData)

        // get component and update parent and teleport id
        nextTick(() => {
            panelTabFocus(newPanelId, 0)

            const component = allComponents.value.find( (component:TabItem) => component.id === sourceData.id)
            if(component) {
                component.parent = newPanelId;
                component.initized = true
            }else{
                allComponents.value.push({
                    ...sourceData,
                    initized: true,
                    parent: newPanelId,
                })
            }
        })
  }
}

export function addTabToPanel(panelId:string, newTab: TabItem ) {
    const layout = useTabLayout()
    const allComponents = useTabComponent()
    const parentId = layout.value.findIndex(tab => tab.id === panelId);
    if(parentId !== -1) {
        newTab.id = "new-tab-" + new Date().getTime()
        newTab.initized = true
        newTab.parent = panelId
        layout.value[parentId].tabs.push(newTab)
        nextTick(() => {
            panelTabFocus(panelId, layout.value[parentId].tabs.length - 1)
            allComponents.value.push({
                ...newTab
            })
        })
    }
}

export function panelRouteUpdate(panelId:string, lastTabId:string, newTabItem:TabItem) {
    const layout = useTabLayout()
    const allComponents = useTabComponent()
    const panelIndex = layout.value.findIndex(panel => panel.id === panelId)
    if(panelIndex !== -1) {
        const index = layout.value[panelIndex].tabs.findIndex( tab => tab.id === lastTabId);
        if(index === -1) throw new Error('Tab not found when router change')
        layout.value[panelIndex].tabs[index] = deepCopy(newTabItem)
        const indexInAllComponent = allComponents.value.findIndex(item => item.id === newTabItem.id)
        if(indexInAllComponent !== -1) {

            allComponents.value[indexInAllComponent] = newTabItem
        }
    }
}

export function addTabInCurrentPanel(newTab: TabItem ) {
    const layout = useTabLayout()
    const allComponents = useTabComponent()
    const hightLightPanel = useCurrentTargetPanel()
    const parentId = layout.value.findIndex(tab => tab.id === hightLightPanel.value)
    // create new id for new tab
    newTab.id = "new-tab-" + new Date().getTime()
    newTab.initized = true
    newTab.parent = hightLightPanel.value
    if(parentId !== -1) {
        layout.value[parentId].tabs.push(newTab)
        nextTick(() => {
            panelTabFocus(hightLightPanel.value, layout.value[parentId].tabs.length - 1)
            allComponents.value.push(newTab)
        })
    }
}

/**
 * system message receiver
 * TODO：該方法需要抽到一個 dialog 頁面中，再重新調 checkTabIsRouterExist 方法
 * 打開彈窗根據 message Id 重新渲染 HTML 内容
 */
window.addEventListener('urlToRouterObject', async (messageId: any) => {
  console.log('urlToRouterObject', messageId)
  // TODO 根據 message ID 獲取對應的站内 HTML，點擊站内的 html 進行 router 跳轉

  try {
    // const allMenu: any = allMenuItem
    // const routerObject = allMenu[event.detail.path]
    // checkTabIsRouterExist(routerObject.createRouteItem(event.detail.data))
  } catch (e) {
    console.log(e)
  }
})

/**
 * Check if pagination exists in the route; if so,
 * Check whether a new pagination needs to be opened according to the routing rules.
 * @param menuItem RouterObject
 * @return Current tab | home
 */
export function checkTabIsRouterExist(menuItem: any) {
  if (!menuItem) {
    return
  }

  const allComponents = useTabComponent()
  const layout = useTabLayout()
  const tabItem: TabItem = {
    ...menuItem,
    initized: true
  }

  // 尝试聚焦已存在的 tab
  const existingTab = allComponents.value.find(item => item.name === tabItem.name)
  if (existingTab) {
    const panelIndex = layout.value.findIndex(panel => panel.id === existingTab.parent)
    if (panelIndex !== -1) {
      const tabIndex = layout.value[panelIndex].tabs.findIndex(item => item.name === existingTab.name)
      if (tabIndex !== -1) {
        layout.value[panelIndex].showingTabIndex = tabIndex
        if (!layout.value[panelIndex].tabs[tabIndex].initized) {
          layout.value[panelIndex].tabs[tabIndex].initized = true
        }
        panelTabFocus(layout.value[panelIndex].id, tabIndex)
        return
      }
    }
  }

  // 如果不存在，则添加新 tab
  addTabInCurrentPanel(tabItem)
}
