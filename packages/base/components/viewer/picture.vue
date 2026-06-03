<script setup lang="ts">
const props = withDefaults(defineProps<{
  images: string[]
  options?: Record<string, any>
}>(), {
  options: () => ({})
})

const emits = defineEmits(['fail'])

function show() {
  // InlineOcrPreview is always visible; no lightbox to show
}
</script>

<template>
  <div class="pictureContainer">
    <InlineOcrPreview v-if="images.length" :src="images[0]" />
  </div>
</template>

<style scoped lang="scss">
.pictureContainer {
  width: 100%;
  height: 100%;
}
</style>
