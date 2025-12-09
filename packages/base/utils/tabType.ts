import type { InjectionKey, RouterParams } from '#imports';
import type {DroppableItem} from './dragType'
export interface TabItem extends DroppableItem {
    parent?:string
    initized?: boolean
}// tab panel container

export type TabPanel = {
    id: string
    size?: number,
    parent:string
    showingTabIndex?: number
    tabs: TabItem[]
}

interface TabManager {
    fullscreenItem: Ref<TabItem | undefined>
    dialogOpened: Ref<boolean>,
    menuStick: Ref<boolean>
    closeDialog:() => void,
    openFocusMode:(tab:TabItem) => void
    openNewDialog:(args: any) => void
    openTab:(tab:TabItem, ignoreFocus: boolean) => void
    openInNewTab:(tab:any) => void
    openInCurrentTab:(tab:TabItem) => void
    toggleMenuStick:() => void
}

interface TabComponentHelper {
    renameTab:(panelId:string, tabId:string, newName:string) => void
    
    tabDataKey:symbol
}

export const TabManagerKey: InjectionKey<TabManager> = Symbol('tabManager');
export const TabComponentKey: InjectionKey<TabComponentHelper> = Symbol('tabComponent');
