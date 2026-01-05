<template>
  <div class="md-table-header" @click="handleClick">
    {{ column.field }}
    <SvgIcon src="/icons/tools/more.svg" />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  column: any
}>()

function handleClick() {
  console.log('handleClick', props.column)
}
</script>
<style scoped lang="scss">
.md-table-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
