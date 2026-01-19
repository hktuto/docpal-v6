<template>
  <UiPopoverDialog ref="popoverRef" :width="200">
    <div v-for="item in list" :key="item.label" :class="`mdTableHeader-item mdTableHeader-${item.type}`" @click="handleClick(item.type)">
      <SvgIcon :src="item.icon" />
      <span>{{ item.label }}</span>
    </div>
  </UiPopoverDialog>
</template>
<script setup lang="ts">
const emits = defineEmits(['headerClick'])
let triggerEl: HTMLElement | null = null
let column: any = null
const list = [
  { label: 'Change Column Type', icon: '/icons/edit.svg', type: 'edit' },
  { label: 'Edit Description', icon: '/icons/edit.svg', type: 'editDescription' },
  // { label: '设置列权限', icon: '/icons/permission.svg', type: 'permission' },
  { label: 'Insert Column to Left', icon: '/icons/insert-left.svg', type: 'insertLeft' },
  { label: 'Insert Column to Right', icon: '/icons/insert-right.svg', type: 'insertRight' },
  // { label: '复制列', icon: '/icons/copy.svg', type: 'copy' },
  { label: 'Sort A-Z', icon: '/icons/sort-az.svg', type: 'sortAz' },
  { label: 'Sort Z-A', icon: '/icons/sort-za.svg', type: 'sortZa' },
  { label: 'Hide Column', icon: '/icons/hide.svg', type: 'hide' },
  { label: 'Delete Column', icon: '/icons/delete.svg', type: 'delete' }
]
const popoverRef = ref()
function open(_triggerEl: HTMLElement | null, _column: any) {
  triggerEl = _triggerEl
  column = _column
  popoverRef.value.open(triggerEl)
}
function handleClick(type: string) {
  popoverRef.value.close()
  emits('headerClick', type, triggerEl, column)
}
defineExpose({
  open
})
</script>
<style scoped lang="scss">
.mdTableHeader-item {
  display: flex;
  gap: var(--app-space-xs);
  justify-content: start;
  cursor: pointer;
  padding: var(--app-space-xs);
  &:hover {
    background: var(--app-primary-alpha-10);
    color: var(--app-primary);
  }
}
</style>
