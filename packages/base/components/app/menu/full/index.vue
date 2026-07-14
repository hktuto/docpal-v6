<script lang="ts" setup>

const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found on menu')
}
const menuStyle = useMenuStyle()
const menuState = useFullMenuState()
const props = defineProps<{
  displayMenu: any[]
}>()
const layout = useTabLayout()
const hightLightPanel = useCurrentTargetPanel()
const { t} = useI18n()
function toggleMenuStyle(){
  menuStyle.value = 'stack'
  localStorage.setItem('docPalMenuStyle','stack')
}
const selectedMenuItem = ref<TabItem | undefined>()


function handleSelect(item:MenuItem) {
  tabProvider?.openInCurrentTab(item)
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
<div v-if="menuState === 'float'" class="floatPositionLock">

</div>
<div :class="{fullMenuContainer:true, [menuState]:true}">
  <div class="menuHeader">
    <img class="logo"  src="/icons/logo-withName-light.svg" />
  </div>
  <div class="menuBody">
    <AppMenuSearch menuMode="expand"/>
    <AppMenuFullItem  v-for="(item, index) in displayMenu" :key="index" :item="item" :selectedMenuItem="selectedMenuItem" @click="handleSelect"/>
  </div>
  <div class="menuFooter">
    <div class="toggleContainer">
      <Icon name="mdi:arrow-expand-left" @click="toggleMenuStyle" />
    </div>
    <AuthUser menuMode="expand" />
  </div>
</div>
</template>


<style lang="scss" scoped>
.floatPositionLock{
  width: var(--app-space-s);
  height: 100%;;
}
.toggleContainer{
  cursor: pointer;
  color: var(--app-grey-300);
  flex: 1 0 auto;
}
.menuHeader{
  padding: var(--app-space-xs);
}
.logo {
  width: clamp( 80px, 100%, 100px);
}
.fullMenuContainer{
  height: 100vh;
  overflow: hidden;
  width: calc(220px + var(--app-space-xs) * 2);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  padding:0;
  &.float {
    position: absolute;
    left: 0;
    top: var(--app-space-xs);
    height: calc( 100dvh - var(--app-space-xs) * 2);
    transform: translateX(-220px);
    transition: all 0.2s ease-in-out;
    z-index: 2;
    border-radius: var(--app-border-radius-m);
    background-image: linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, var(--app-primary-alpha-10) 2%, var(--app-primary-alpha-30) 98%, hsla(var(--app-primary-h), var(--app-primary-s), calc(var(--app-primary-l) *  0.1), 0.1 ) 100%);
    box-shadow: 10px 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.31);
    &:hover, &:focus, &:focus-within {
      transform: translateX(0);
    }

  }
}
.menuBody{
  min-height: calc(100vh - 120px);
  overflow: auto;
  width: 100%;
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);

}
.menuFooter{
  width:100%;
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-s);
  .userMenuWidgetContainer{
    flex: 0 0 auto;
    width:auto;
  }
}
</style>
