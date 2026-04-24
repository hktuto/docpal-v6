<script lang="ts" setup>
// Props passed from menu router
const props = defineProps<{
  id?: string
}>()

// Inject menu router for navigation/props updates
const routerProvider = inject(MenuRouterKey)

// Example: Update props when needed
// function handleIdChange(newId: string) {
//   routerProvider?.updateProps({ id: newId })
// }
</script>

<template>
  <div class="page-container">
    <div class="page-content">
      <h1>Canvas Renderer</h1>
      <p>This is a placeholder page. Start building your component here!</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
}

.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--app-space-m);
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--app-text-color);
  }
  
  p {
    color: var(--app-text-color-secondary);
  }
}
</style>
