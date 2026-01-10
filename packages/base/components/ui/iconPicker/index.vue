<script setup lang="ts">
  const props = defineProps<{
    modelValue: string
  }>()
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()
  const pickerRef = ref()
  const containerRef = ref()


  function handleClick() {
    pickerRef.value.open(containerRef.value)
  }
  function handleIconSelected(icon:string) {
    emit('update:modelValue', icon)
    pickerRef.value.close()
  }
</script>

<template>
  <div
    class="iconPicker"
    ref="containerRef"
    v-bind="$attrs"
    tabindex="0"
    role="button"
    :aria-label="modelValue ? `Selected icon: ${modelValue}. Press Enter to change.` : 'Select an icon'"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <Icon v-if="modelValue" :name="modelValue" 
      @click="handleClick"
      
    />
    <Icon v-else name="mdi:plus" 
      @click="handleClick"
      @keydown.enter.prevent="handleClick"
      @keydown.space.prevent="handleClick"
    />
  </div>
  <UiPopoverDialog
    ref="pickerRef"
    :teleportTo="containerRef"
  >
    <UiIconPickerSelector @selected="handleIconSelected" />
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.iconPicker {
  font-size: var(--icon-size, var(--app-font-size-l));
  line-height: 0;
  cursor: pointer;
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-l);
  z-index: 2;
  transition: outline 0.15s ease, background-color 0.15s ease;

  &:hover {
    background-color: var(--app-grey-850);
  }

  &:focus {
    outline: 2px solid var(--app-primary-color);
    outline-offset: 2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--app-primary-color);
    outline-offset: 2px;
  }
}
</style>
