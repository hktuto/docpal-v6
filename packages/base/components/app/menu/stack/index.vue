<script setup lang="ts" generic="T extends MenuItem">

const props = defineProps<{
    displayMenu: any[]
}>()
const menuStyle = useMenuStyle()
const layout = useTabLayout()
const hightLightPanel = useCurrentTargetPanel()
const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found on menu')
}
const { t } = useI18n()

const menuMode = ref<'collapse' | 'expand'>('collapse')


const selectedMenuItem = ref<TabItem | undefined>()



const expandMenu = ref<MenuItem>()
const showExpandMenu = ref(false)

function handleHover(item:MenuItem) {
  expandMenu.value = JSON.parse(JSON.stringify(item)) || []
  showExpandMenu.value = true
}

function handleSelect(item:any) {
  if(menuMode.value === 'expand' && item.children&& item.children.length > 0) {
    expandMenu.value = JSON.parse(JSON.stringify(item)) || []
  }
  if(item.component) {
    tabProvider?.openInCurrentTab(item)
    handleWrapperMouseLeave()
  }
}

function handleWrapperMouseLeave() {
  showExpandMenu.value = false
}

function handleWrapperFocusOut() {
  showExpandMenu.value = false
}

function toggleMenuMode() {
  menuMode.value = menuMode.value === 'collapse' ? 'expand' : 'collapse'
  localStorage.setItem('menuMode', menuMode.value)
}

watch(() => [layout, hightLightPanel], () => {
    // get hightLightPanel
    setSelectedMenuItem(selectedMenuItem, props.displayMenu, expandMenu)
},{
    deep:true,
})

function toggleMenuStyle(){
  menuStyle.value = 'full'
  localStorage.setItem('docPalMenuStyle','full')
}

// get local storage memory to set menu mode
onMounted(() => {
  const savedMenuMode = localStorage.getItem('menuMode')
  if(savedMenuMode) {
    menuMode.value = savedMenuMode as 'collapse' | 'expand'
  }
  showExpandMenu.value = menuMode.value === 'expand' ? true : false
})


</script>

<template>
    <div 
      :class="{appWrapper:true, [menuMode]:true, showExpand: showExpandMenu}"
      @mouseleave="handleWrapperMouseLeave"
      @focusout="handleWrapperFocusOut"
    >
        <div :class="{menuContainer:true,  [isMobile ? 'mobile' : 'desktop']: true}">
            <div class="menuHeader">

                <slot name="header" />
                <AppLogo style="--icon-size: 2rem;" />
            </div>
            <div class="menuBody">

                <AppMenuSearch menuMode="collapse"/>
                <AppMenuCollapse 
                    :menuMode="menuMode" 
                    :menu="displayMenu"  
                    :selectedMenuItem="selectedMenuItem" 
                    @select="handleSelect" 
                    @hover="handleHover"
                    @mouseOut="handleWrapperMouseLeave"
                  />
              
            </div>

            <div class="menuFooter">
              <div class="iconContainer">
                <Icon name="mdi:arrow-expand-right" @click="toggleMenuStyle" />
              </div>

                <AuthUser menuMode="collapse" /> 
                <slot name="footer"></slot>
            </div>
        </div>
        <div :class="{menuExpand:true, [menuMode]:true}">
          <div class="expandMenuHeader">
            <div class="toggleIcon">
                  <Icon class="menuToggleIcon" :name="menuMode === 'collapse' ? 'lucide:chevron-right' : 'lucide:chevron-left'" @click="toggleMenuMode" />
                </div>
            
          </div>
          
          <AppMenuExpand v-if="expandMenu" :menu="expandMenu" :selectedMenuItem="selectedMenuItem"  @select="handleSelect" />
        </div>
        <!-- <div class="menuToggleer" @click="toggleMenuMode">
           
        </div> -->
    </div>
</template> 

<style scoped lang="scss">   
.expandMenuHeader{
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
}                                                 
.toggleIcon{
  padding: var(--app-space-xs);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: var(--app-font-size-xl);
}
.iconContainer{
  color: var(--app-grey-300);
  cursor: pointer;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--app-space-s);
}

.menuHeader{
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    align-items: center;
    padding: var(--app-space-m) var(--app-space-s) 0 var(--app-space-s);

}

.menuExpand{
  height: 100%;
  width: 200px;
  overflow-y: auto;
  padding: var(--app-space-s);
  border-left: 1px solid var(--app-grey-800);
  
  &.collapse{
    position: fixed;
    top: var(--app-space-m);
    height: calc(100% - var(--app-space-m) * 2);
    left: calc(60px + var(--app-space-xs));
    transform: translateX(-50px);
    transition: transform 0.4s ease-in-out, opacity 0.15s linear, visibility 0.15s linear;
    z-index: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    overflow: hidden;
    border-radius: var(--app-border-radius-m);
    background-image: linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, var(--app-primary-alpha-10) 2%, var(--app-primary-alpha-30) 98%, hsla(var(--app-primary-h), var(--app-primary-s), calc(var(--app-primary-l) *  0.1), 0.1 ) 100%);
    box-shadow: 10px 4px 30px rgba(0, 0, 0, 0.1);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.31);
  }
}
.appWrapper{
    height: 100%;
    width: 100%;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    overflow: visible;
    transition: all 0.2s ease-in-out;
    z-index: 0;
    --menu-color: var(--app-primary-6);
    &.collapse{

      flex-flow: row nowrap;
      .menuContainer{
        flex: 1 0 ;
      }

    }
    &.expand{
      flex-flow: row nowrap;
    }
    &.showExpand{
      z-index: 2;
      &.expand{
        z-index: 1;
      }
      .menuExpand{
        transform: translateX(0);
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        z-index: 2;
        transition: transform 0.4s ease-in-out, opacity 0.25s ease-in-out, visibility 0s;
      }
    }
    --menu-gap: var(--app-space-xxs);
    --icon-font-size: calc(var(--app-font-size-m) * 1.2);
    --menu-item-padding: var(--app-space-xs);
    --menu-item-radius: var(--app-border-radius-m);
    --menu-item-normal-bg: rgba(0,0,0,0);
    --menu-item-active-bg: var(--app-grey-950);
    --menu-item-normal-color: var(--app-success-4);
    --menu-item-hover-color: var(--app-accent-color);
    --menu-item-active-color: var(--app-main-color);
    position: relative;
}
.menuContainer{
  flex: 0 0 ;
  width:100%;
  height: 100vh;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-s);
  position: relative;
  z-index: 1;
  &.mobile{
    height: 100%;
  }

}
.menuBody{
    width: max-content;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--app-space-xs);
    font-size: var(--icon-font-size);
    position: relative;
    overflow-y: auto;
    padding: var(--app-space-s);

    font-size: var(--app-font-size-l);
    /* Custom scrollbar for .menuBody */
    &::-webkit-scrollbar {
        width: 5px;
        background: none;
    }
    &::-webkit-scrollbar-thumb {
        background: var(--app-grey-900, #222);
        border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
        background: none;
    }
    scrollbar-width: thin;
    scrollbar-color: var(--app-grey-900, #222) transparent;

}
.menuFooter{
    font-size: var(--icon-font-size);
    padding: var(--app-space-s);
    overflow-x: hidden;
}
</style>

