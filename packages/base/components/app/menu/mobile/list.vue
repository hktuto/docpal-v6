<script setup lang="ts">
const props = defineProps<{
    menu: any[]
}>()

const expandedItem = ref<number[]>([])
const emits = defineEmits(['select'])

function itemClick(item:any, index:number, e:any){
  console.log("itemClick")
  e.stopPropagation()
  if(item.children && item.children.length > 0) {
    toggleExpanded(index)
    return
  }
  emits('select', item)
}

function childClick(item, e) {
  console.log("childClick")
  e.stopPropagation()
  emits('select', item)
}

const toggleExpanded = (index:number) => {
  if(expandedItem.value.includes(index)) {
    expandedItem.value = expandedItem.value.filter(item => item !== index)
  } else {
    expandedItem.value.push(index)
  }
}
</script>

<template>
  <div class="menuList">
    <div v-for="(item,index) in menu" :key="item.id" class="menuItem" @click="e => itemClick(item, index, e)">
      <div class="menuIcon">
        <Icon :name="item.icon" />
      </div>
      <div class="menuLabel">
        {{ $t(item.label) }}
      </div>
      <div v-if="item.children && item.children.length > 0" class="toggleIcon">
        <Icon :name="expandedItem.includes(index) ? 'lucide:chevron-up' : 'lucide:chevron-down'"  />
      </div>
      <div v-if="item.children && expandedItem.includes(index)" class="menuChildren">
        <div v-for="(child,childIndex) in item.children" :key="child.id" class="menuItem" @click="e => childClick(item,e)">
            <div class="menuIcon">
              <Icon :name="child.icon" />
            </div>
            <div class="menuLabel">
              {{ $t(child.label) }}
            </div>
        </div>
      </div>
    </div>
  </div>    
</template>

<style lang="scss" scoped>
.menuList{
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0;
}
.menuItem{
  display: flex;
  flex-flow: row wrap;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  gap: 0;
  padding: var(--app-space-xs);
  cursor: pointer;
  border-radius: var(--app-border-radius-s);
  color: var(--app-success-4);
  &:hover {
    background: var(--app-success-2);
    color: var(--app-success-6);
  }
  .menuIcon{
    font-size: var(--app-font-size-l);
  }
  .menuLabel{
    font-size: var(--app-font-size-s);
    flex: 1 0 auto;
  }
  .toggleIcon{
    font-size: var(--app-font-size-l);
  }
  .menuChildren{
    flex: 1 0 auto;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    width: 100%;
    gap: var(--app-space-xs);
    margin-bottom: var(--app-space-s);
    padding-top: var(--app-space-xs);
  }
}
</style>
