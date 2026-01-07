<script setup lang="ts">
const props = defineProps<{
  isAdmin: boolean
}>()
const { workspace } = useSingleWorkspaceContext()
</script>

<template>
  <div class="detailContainer">
    <h1>{{ workspace?.name }}</h1>
  </div>
</template>

<style lang="scss" scoped>
  .detailContainer{
    margin: 0 auto;
    width: 100%;
    max-width: var(--app-max-width);
    padding: var(--app-space-l);
  }
</style>
