<script lang="ts" setup>
import { useEventBus, EventType, emitBus } from 'eventbus'
const  { appMenu, adminMenu } = useAppConfig()
const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found on menu')
}
const props = defineProps<{
    displayMenu: any[]
}>()
const opened = ref(false)
const menuItemRefs = ref()
const selectedMenuItem = ref<TabItem | undefined>()
  const layout = useTabLayout()
const hightLightPanel = useCurrentTargetPanel()
const CONTEXT_MENU_OPEN_BUS = useEventBus(EventType.TABLE_CONTEXT_MENU_OPEN)
function openExpandMenu(e:any, item:any){
  const evtParams: TABLE_CONTEXT_PARAMS = {
    row: item,
    column: item,
    rowIndex: 0,
    options: [item.children.map((child:any) => {
      return {
        name: child.label,
        visible: true,
        disabled: false,
        action:() => {
          tabProvider?.openInCurrentTab(child)
        }
      }
    })],
    event: e
  }
  CONTEXT_MENU_OPEN_BUS.emit(evtParams)

}

function handleSelect(item:any){
  if(item && item.component) {
    tabProvider?.openInCurrentTab(item)
  }
  opened.value = false
}

watch(() => [layout, hightLightPanel], () => {
    // get hightLightPanel
    setSelectedMenuItem(selectedMenuItem, props.displayMenu )
},{
    deep:true,
    immediate:true
})
</script>

<template>
<div class="mobileMenuContainer">
  <AppLogo style="--icon-size: 2rem;"  @click="opened = !opened"/>
  <div class="inlineMenuList">
    <template v-for="(item,index) in displayMenu" :key="index">
      <template v-if="item.children && item.children.length > 0" >
        <div ref="menuItemRefs" class="menuItem" @click="e => openExpandMenu(e, item)">
          <div class="menuIcon">
            <Icon :name="item.icon" />
          </div>
          <div class="menuLabel">
            {{ $t(item.label) }}
          </div>
        </div>
      </template>
      <template v-else>
        <div  class="menuItem" @click="handleSelect(item)">
          <div class="menuIcon">
            <Icon :name="item.icon" />
          </div>
          <div class="menuLabel">
            {{ $t(item.label) }}
          </div>
        </div>
      </template>
    </template>
    
  </div>
  <div :class="{fullscreenMenu:true, opened}">
    <div class="backdrop" @click="opened = false"></div>
    <div class="fullscreenMenuContent" @click.stop>

      <AppMenuSearch menuMode="collapse"/>
      <ElDivider />
      <div class="fullMenuContainer">
        <AppMenuFullItem  v-for="(item, index) in displayMenu" :key="index" :item="item" :selectedMenuItem="selectedMenuItem" @click="handleSelect"/>
      </div>
      <ElDivider />
      <AuthUser menuMode="expand" /> 
    </div>
  </div>

</div>
</template>

<style lang="scss" scoped>
.fullMenuContainer{
  width:100%;
  overflow: auto;
  :deep(.menuItem){
    width:100%;
  }
}
.mobileMenuContainer{
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: var(--app-space-s);
  font-size: var(--app-font-size-l);
}
.inlineMenuList{
  flex: 1 0 auto;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  align-items: center;
  overflow: auto;
  position: relative;
  width: 100%;
}
.menuItem{
  flex: 0 0 auto;
  width: 60px;
  cursor: pointer;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  color: var(--menu-color);
  position: relative;
  overflow: hidden;
  .menuIcon{
    font-size: var(--app-font-size-l);
  }
  .menuLabel{
    font-size: var(--app-font-size-s);
    text-align: center;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
.fullscreenMenu{
  width: 100%;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  overflow: auto;
  transform: translateY(100dvh);
  transition: all 0.3s ease-in-out;
  padding: var(--app-space-s);
  isolation: isolate;
  &.opened{
    transform: translateY(0);
  }
}
.backdrop{
  width: 100%;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  background: rgba(0, 0, 0, 0);
}
.fullscreenMenuContent{
  width: 100%;
  height: 100%;
  border-radius: var(--app-border-radius-m);
  background: rgba(255, 255, 255, 0.4);
  border-radius: var(--app-border-radius-l);
  box-shadow: 10px 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(6.3px);
  -webkit-backdrop-filter: blur(6.3px);
  border: 1px solid rgba(255, 255, 255, 0.31);
  padding: var(--app-space-s);
  overflow-y: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
}

</style>

