<script lang="ts" setup>
// Unregister all service workers in development mode
const ready = ref(false)
// Call the function when the app mounts
onMounted(async () => {
  // unregisterServiceWorkers()
  try {
    await getLocale()
  } catch (e) {
    console.error(e)
  }
  ready.value = true
})
</script>

<template>
  <template v-if="ready">
    <NuxtPage />
  </template>
  <template v-else>
    <NuxtLoadingIndicator />
  </template>
  <AppUpdateToast />
  <Contextmenu />
</template>
