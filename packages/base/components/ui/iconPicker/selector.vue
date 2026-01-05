<script setup lang="ts">
const init = ref(false)
const iconCategories = ref<any[]>([
  {key: 'fluent-emoji-flat', name: 'Emoji', icons:[
    "fluent-emoji-flat:aerial-tramway",
    "fluent-emoji-flat:airplane",
    "fluent-emoji-flat:airplane-arrival",
    "fluent-emoji-flat:airplane-departure",
    "fluent-emoji-flat:alarm-clock",
    "fluent-emoji-flat:alembic",
    "fluent-emoji-flat:alien"
  ]},
  {name:'Lucide', key: 'lucide', icons:[]},
  {name:'Material Design', key: 'mdi', icons:[]},
  {name:'Ionicons', key: 'ion', icons:[]},
  {name:'Heroicons', key: 'heroicons', icons:[]},
  {name:'Tabler Icons', key: 'tabler', icons:[]},
])

const selectedCategory = ref<any>(iconCategories.value[0])


const emits = defineEmits(['selected'])


function handleIconClick(icon:any) {
  emits('selected', icon)
}


onMounted(async () => {
  // await getIconCategories()
})

</script>

<template>
  <div  class="iconSelector">
    <div class="categoryList">
      <div class="categoryItem" v-for="category in iconCategories" :key="category.key" @click="selectedCategory = category">
        {{ category.name }}
      </div>
    </div>
    <div class="iconList">
      <div class="iconItem" v-for="icon in selectedCategory.icons" :key="icon" @click="handleIconClick(icon)">
        <Icon :name="icon" />
        
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.iconSelector {
  line-height: 1;
  .categoryList {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
  }
  .iconList {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);
    
  }
}
.iconItem{
  font-size: var(--app-font-size-xl);
}
</style>
