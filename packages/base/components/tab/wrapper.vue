<script setup lang="ts" >
import { useStorage, useEventListener } from '@vueuse/core'
import { TabManagerKey, createError, inject, computed, ref, onMounted } from '#imports'

const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found')
}
const ready = ref(false)
function layoutReadyHandler(){
    ready.value = true
}
const isDesktopMode = useDesktopMode()
const isMac = useIsMac()
const mainPanel = ref();
const userDefineSize = useStorage('app-tab-size', 200) // user define sie in pexel
const haveInteractDrawer = ref(false)


const displayUserDefineSize = computed(() => {
    if(userDefineSize.value > window.innerWidth) return 200 / window.innerWidth * 100;
    return userDefineSize.value / window.innerWidth * 100;

})

type paneResizedParams = {
    panes:{min:number, max:number, size:number}[]
}
function paneResized(sizes:paneResizedParams) {
    /**
     * check if sizes length is greater than 1
     * if so, update userDefineSize
     *
     */
    if(sizes.panes.length > 1) {
        const panes = sizes.panes
        const size = panes[0]?.size ?? 0
        const sizeInPixel = window.innerWidth * ( size / 100 )
        userDefineSize.value = sizeInPixel
    }
}

const isMenuStick = computed(() => {
    return tabProvider.menuStick.value
})

function initPanelSize() {
    const size = userDefineSize.value
}


onMounted(() => {
    calMinWidth()
    initPanelSize()
})

const interactDrawerAction = ref('')
const InteractDrawerRef = ref()
  function handleOpenUpload(show: boolean = false, action: 'upload' | 'ai' | '' = 'upload') {
    console.log({action});
    haveInteractDrawer.value = true
    interactDrawerAction.value = action
    InteractDrawerRef.value.handleSwitch(show)
  }
  function closeDrawer() {
    haveInteractDrawer.value = false
    interactDrawerAction.value = ''
  }

const minSize = ref(0)
function calMinWidth(){
    // panel size is 280px, check the percentage of window width
    const windowWidth = window.innerWidth
    minSize.value = 280 / windowWidth * 100

}
if(window){
    useEventListener(window, 'resize', calMinWidth)
}

provide('handleOpenUploadDrawer', handleOpenUpload)

</script>

<template>
    <div :class="{appFullPage: true, [isMobile ? 'mobile' : 'desktop']: true, isDesktopMode, isMac}" >
      <div :class="{appSidebar:true, [isMobile ? 'mobile' : 'desktop']: true}">

      <slot name="sidebar" />
      </div>
      <div :class="{appMainContainer: true, [isMobile ? 'mobile' : 'desktop']: true}">
          <div class="appContent">
              <slot />
          </div>
      </div>
    </div>
</template>

<style scoped lang="scss">
.appFullPage{
    --page-padding:  0;
    width: 100svw;
    height: 100dvh;
    overflow: hidden;
    background: var(--app-bg);
    background-color: var(--app-grey-900);
    -webkit-app-region: drag;
    display: grid;
    grid-template-areas: "sidebar main";
    grid-template-columns: min-content 1fr;
    --panel-border-radius: 0;
    position: relative;
    &.mobile{
      grid-template-areas: "main"
                            "sidebar";
      grid-template-rows: 1fr min-content;
      grid-template-columns: 1fr;
    }
    &.isDesktopMode{
      &.isMac{
        :deep(.menuContainer){
          padding-top: 20px;
        }
      }
    }
}
.appSidebar{
  grid-area: sidebar;
  -webkit-app-region: no-drag;
  &.mobile{
    width: 100%;
    position: relative;
    overflow: hidden;
  }

}
.appMainContainer{
  grid-area: main;
    -webkit-app-region: drag;
    --container-radius: var(--app-border-radius-l);
    --container-padding: 0px;
    overflow: visible;
    padding: var(--app-space-s) var(--app-space-s) var(--app-space-s) 0;
    height:100%;
    z-index: 1;
    &.mobile {
      padding: 0;
      overflow: hidden;
      position:relative;
      .appContent{
        height: 100%;
        overflow: hidden;
      }
    }

}
.appContent{
    height: calc(100dvh - var(--app-space-s) * 2 );
    width:100%;
    position: relative;
    overflow: visible;
    z-index: 2;
    // box-shadow: var(--app-shadow-l);
    -webkit-app-region: no-drag;

}

</style>
