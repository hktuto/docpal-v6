<script setup lang="ts">

const props = defineProps<{
    menu: any,
    selectedMenuItem?:TabItem,
    hideHeader?:boolean 
}>()
const { selectedMenuItem, menu } = toRefs(props)

const { t } = useI18n()

const selectedIndex = ref<any>()

watch([selectedMenuItem, menu], ([newSelectedMenuItem, newMenu]) => {
  if(!newSelectedMenuItem || !newMenu || !newMenu.children ){
    selectedIndex.value = null;
    return
  } 
  
  let found = false
  newMenu.children.forEach((element:any, index:number) => {
    if(element.name === newSelectedMenuItem.name) {
      found = true
      selectedIndex.value = index
      return
    }
  });
  if(!found){
    selectedIndex.value = null;
  }
},{
  deep:true,
  immediate: true
})



</script>

<template>
  <div class="expandMenuContainer">
    <div v-if="!hideHeader" class="header">
      <Icon v-if="menu.icon" :name="menu.icon" />
      <div class="label">
        {{ t(menu.label || '') }}
      </div>
    </div>
    <template v-if="menu && menu.children && menu.children.length > 0" v-for="(item,index) in menu.children" :key="item.component">

      <template v-if="item.inlineComponent">
        <component :is="item.inlineComponent" :menuItem="item" :selected="index === selectedIndex" @selected="$emit('select', item)"/>
      </template>
      <template v-else>
        <AppMenuExpandItem :item="item" @click="$emit('select', item)" :selected="selectedIndex === index" />
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.expandMenuContainer{
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
}
.header{
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
  font-size: var(--app-font-size-l);
  color: var(--menu-color);
  margin-block: var(--app-space-s);
  .label{
    
    font-weight: 700;
  }
}

</style>
