<script setup lang="ts">
const { homeList, currentHome, checkoutDashboard } = useHomePage()
const tabProvider = inject(TabManagerKey)
if(!tabProvider) {
    throw createError('tab manger not found on menu')
}
const emit = defineEmits(['selected'])
async function handleSelect(e:Event, item: any) {
  e.stopPropagation()
  await checkoutDashboard(item);
  tabProvider?.openInCurrentTab({
    id:'client-work-panel',
    name : 'client-work-panel',
    label: "adminMenu.workPanel",
    icon: 'material-symbols:home',
    hoverIcon : 'material-symbols:home',
    component: "LazyHomePage",
    feature: "DASHBOARD",
    handleError:true,
    props:{},
  }, false)
  emit('selected')
}
</script>

<template>
  <div class="dashboardList">
    <div :class="{ 'dashboardItem': true, 'selected': currentHome.id === item.id }" v-for="item in homeList" :key="item.id" @click="(e) => handleSelect(e, item)">
      <span class="label">{{ item.name }}</span>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboardList{
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
}
.dashboardItem{
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
  .label{
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  transition: all 0.2s ease-in-out;
  &.selected{
    background: var(--app-primary-color) !important;
    color: var(--app-paper) !important;
    box-shadow: var(--app-shadow-s);
  }
  &:hover{
    box-shadow: var(--app-shadow-s);
    background: var(--app-primary-alpha-30);
  }
}
</style>


