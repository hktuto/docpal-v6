<template>
  <div class="md-table-header" @click="handleClick">
    {{ column.field }}
    <div class="mdTableHeader-trigger" ref="triggerRef">
      <SvgIcon src="/icons/tools/more.svg" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  column: any
}>()
const mdTableHeaderPopover = inject('mdTableHeaderPopover')
const triggerRef = ref()
function handleClick() {
  mdTableHeaderPopover?.value?.open(triggerRef.value, props.column)
}
</script>
<style scoped lang="scss">
.md-table-header {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  .mdTableHeader-trigger {
    cursor: pointer;
    opacity: 0;
  }
  &:hover {
    .mdTableHeader-trigger {
      opacity: 1;
    }
  }
}
</style>
