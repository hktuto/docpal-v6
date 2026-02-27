<script lang="ts" setup>
const props= defineProps<{
  item: MenuItem
  selectedMenuItem: any
}>()
const { selectedMenuItem } = toRefs(props);

const emit = defineEmits(['click', 'hover', 'mouseOut'])
const opened = ref(false);
const selected = ref(false);
const dropOption:any = {
    key: menuKey,
    dragData: {
        key: menuKey,
        type: 'menu',
        data: props.item
    },
    detectDrop: false,
}

if(props.item.onDropItself) {
  dropOption.detectDrop = true
  dropOption.onDropItself = props.item.onDropItself;
}
const { dragState ,setupDrag } = useDragable(dropOption)
const elRef = ref()
const { t } = useI18n()

function handleClick(item:any) {
  if(item.children){
    opened.value = !opened.value
    return
  }
  emit('click', item)
}


onMounted(() => {
    if(!elRef) return
    if(props.item.component && props.item.component !== '') {
        // only dragable if no children
        setupDrag(elRef.value)
    }
})



watch(selectedMenuItem, (newSelectedMenuItem) => {
  if(!newSelectedMenuItem) return
  let isSelected = false
  if(props.item.name === newSelectedMenuItem.name){
    isSelected = true
  }
  if(props.item.children){
    const isSelectedChild= props.item.children.find((child:any) => child.name === newSelectedMenuItem.name)
    isSelected = !!isSelectedChild
  }
  selected.value = isSelected
},{
  deep:true,
  immediate: true
})
</script>

<template>
<div class="menuItem" 
    v-tooltip="t(item.label || '')"
  @click="handleClick(item)" >
  <div ref="elRef" :class="{itemContainer:true,selected, opened }">


      <div class="icon">
        <template v-if="selected && item.hoverIcon">
          <Icon :name="item.hoverIcon"></Icon>
        </template>
        <template v-else>
          <Icon :name="item.icon"></Icon>
        </template>
      </div>
      <div class="label">
        {{ t(item.label || '') }}
      </div>
      <div v-if="item.children" class="expandIcon">
        <Icon :name="opened ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'" />
      </div>
    </div>
    <div v-if="opened" class="subMenuContainer">
      <AppMenuExpand :menu="item" :selectedMenuItem="selectedMenuItem" hideHeader @select="handleClick" />
    </div>
  </div>
  
  <Teleport v-if="dragState.type === 'preview'" :to="dragState.container">
            <div class="dropPreviewFile">
                <Icon v-if="item.icon" :name="item.icon"></Icon>
            </div>
        </Teleport>
</template>


<style scoped lang="scss">
.subMenuContainer{
  width: 100%;
  padding-block: var(--app-space-s);
  padding-inline: var(--app-space-xs);
  background: hsla(var(--app-grey-hue), var(--app-grey-saturation), 97%, 0.5);
  border-bottom-left-radius: var(--app-border-radius-s);
  border-bottom-right-radius: var(--app-border-radius-s);
  margin-bottom: var(--app-space-xs);
}
.itemContainer{
  cursor: pointer;
  width: 100%;
  line-height: 1;
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  color: var(--app-grey-200);
  .icon{
    font-size: calc(var(--app-font-size-xl) * 0.8);
    line-height: 0;
  }
  &.selected{
    background: var(--app-primary-color) !important;
    box-shadow: var(--app-shadow-primary-l);
    color: var(--app-paper);
    &:hover, &.opened{
      color: var(--app-paper);
    }
  }
  &.opened{
    color: var(--app-primary-color);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: none;
    backdrop-filter: blur(6.3px);
    -webkit-backdrop-filter: blur(6.3px);
    // border: 1px solid rgba(255, 255, 255, 0.31);
    border-bottom-left-radius :0;
    border-bottom-right-radius: 0;
  }
  &:hover, {
    color: var(--app-primary-color);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: var(--app-shadow-m);
    backdrop-filter: blur(6.3px);
    -webkit-backdrop-filter: blur(6.3px);
    border: 1px solid rgba(255, 255, 255, 0.31);
  }
}
.menuItem{
  width: 100%;
  
  
  
}
.label{
  // width: 100%;
  flex: 1 0 auto;
  font-size: var(--app-font-size-m);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
