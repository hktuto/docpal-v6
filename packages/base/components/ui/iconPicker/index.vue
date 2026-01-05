<script setup lang="ts">
  const modelValue = defineModel<string>('modelValue')
  const pickerRef = ref()
  const containerRef = ref()

  function handleClick() {
    pickerRef.value.open(containerRef.value)
  }
  function handleIconSelected(icon:string) {
    modelValue.value = icon
    pickerRef.value.close()
  }
</script>

<template>
  <div class="iconPicker" ref="containerRef" @click="handleClick">
    <template v-if="modelValue">
      <Icon :name="modelValue" />
    </template>
    <template v-else>
      <Icon name="mdi:plus" />
    </template>
  </div>
  <UiPopoverDialog
    ref="pickerRef"
  >
    <UiIconPickerSelector @selected="handleIconSelected" />
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.iconPicker{
  font-size: var(--app-font-size-l);
  line-height: 0;
  cursor: pointer;
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-l);
  font-size: var(--app-font-size-xxl);
  &:hover{
    opacity: 0.8;
  }
}
</style>
