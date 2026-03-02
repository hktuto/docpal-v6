<template>
  <div :class="{collectionMenu:true, selected}">
    <div class="header">

      <AppMenuExpandItem 
      :selected="selected"
      :item="{
        name: 'client-collections',
        icon: 'icon-park-outline:layers',
        hoverIcon: 'icon-park-twotone:layers',
        label: 'file_collections',
        component: 'LazyCollectionPage',
        inlineComponent: 'LazyCollectionMenu',
        feature: 'COLLECTION',
        props: {
          idOrPath: '/',
          filter: {}
        }
      }"  >
      <div class="toggle" @click="opened = !opened">
        <Icon :name="opened ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
      </div>
      </AppMenuExpandItem>
      
  </div>
    <div v-if="opened" class="listContainer">

      <div v-for="item in collectionList" :key="item.id" class="item" @click="handleItemClick(item)">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
const pageParams = {
  pageIndex: 0,
  pageSize: 20
}
const props = defineProps<{
  menuItem: any
  selected: boolean
}>()

const opened = ref(false)
const collectionList = ref([])
const loading = ref(false)
const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found')
}

async function getCollectionList() {
  loading.value = true
  const data : any = await newClientApi.getDmsCollection().then(r => r.data)
  collectionList.value = data.entryList
  loading.value = false
}

function handleItemClick(item: any) {
  tabProvider?.openInCurrentTab(props.menuItem)
}

watch(opened, (newVal) => {
  if(newVal) {
    getCollectionList()
  }
})
</script>

<style lang="scss" scoped>
.collectionMenu{
  width:100%;
  &.selected{
    --text-color: var(--app-accent-color);
    .header{
      .menuLabel{
        color: var(--app-accent-color);
      }
    }
  }
}
.header{
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
.listContainer{
  max-height: 300px;
  overflow-y: auto;
  padding-bottom: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
}
.item{
  padding-inline: var(--app-space-xs);
  padding-block: var(--app-space-xxs);
  border-radius: var(--app-border-radius-s);
  color: var(--app-grey-300);
  font-size: var(--app-font-size-s);
  cursor: pointer;
  &:hover{
    background: var(--app-grey-950);
  }
}
</style>
