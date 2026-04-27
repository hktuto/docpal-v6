import type { InjectionKey } from "vue"
import type { DroppableItem } from './dragType'


export interface MenuItem extends DroppableItem {
    label?: string,
    icon: string, // 如果是 inlineRender 會忽略
    hoverIcon?: string, // 如果是 inlineRender 會忽略
    isList?:boolean, // 如果是 true 則直接在 menu 中渲染component, 多用於 children 裡的列表
    inlineRender?:boolean, // 如果是 true 則直接在 menu 中渲染component, 多用於 children 裡的列表
    children?: MenuItem[],
    component?: string,
    inlineComponent?: string, //
    canDrop: (args:any) => boolean,
    onDropItself?:(args:any) => void,
    // 如果 isList 是 true 時必填
}

export interface RouterParams extends DroppableItem {
    menuKey?:symbol,
}


interface MenuProvider {
    navigateTo:(param:TabItem, openInNewTab?:boolean) => void
    updateProps(newProps:any):void
    updateTabName(newName:string):void
    routerContainer: Ref<HTMLElement | null>,
    back: (fallbackItem?:TabItem) => void,
    getHistory:() => RouterParams[],
    refeshActions: Ref<any[]>,
  addToHistory: (param: RouterParams) => void,
  reloadComponent: () => void,
    message:{
        success: (...args) => void,
        error: (...args) => void,
        warning: (...args) => void,
        info: (...args) => void,
        loading: (...args) => void
    },
    notification:{
        success: (...args) => void,
        error: (...args) => void,
        warning: (...args) => void,
        info: (...args) => void,
        loading: (...args) => void
    },
    showErrorPage:(error:Error) => void,
    tabData: Ref<TabItem>
}

export const menuSymbol = Symbol('menu')

export const MenuRouterKey: InjectionKey<MenuProvider> = menuSymbol;


export type PageSetting = {
    id: string, // id with unique time stamp
    name: string, // name to check if tag is exist
    label: string, // label to show in menu
    icon: string, // icon to show in menu
    hoverIcon?: string, // hover icon to show in menu
    component: string, // component to show in menu
    props: {
        [key:string]:any
    }, // props to pass to component
    createRouterParams: (params:any) => RouterParams
}
