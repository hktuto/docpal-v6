<script lang="ts" setup>
const props = defineProps<{
  info: any
}>()
</script>

<template>
  <div class="infoContainer">
    {{ info }}
  </div>
</template>

<style lang="scss" scoped>
.infoContainer {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: var(--app-space-s);
  position: relative;
}
</style>
