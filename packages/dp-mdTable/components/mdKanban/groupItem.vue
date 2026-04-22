<script setup lang="ts">
const props = defineProps<{
  item:any
  field: any
  theme: any;
}>()
</script>

<template>
    <div class="groupItem">

        {{item[props.field]}}
    </div>
</template>

<style lang="scss" scoped>
    .groupItem{
        flex: 0 0 auto;
        width:100%;
        padding: var(--app-space-s);
        border-radius: var(--app-border-radius-s);
        background-color: var(--app-color-bg);
        overflow: hidden;
        border: 1px solid var(--app-grey-800);
    }
</style>
