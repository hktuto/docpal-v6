<script lang="ts" setup>
const props = defineProps<{
  splitInfo: any,
  ocrResult: string,
  formConfig:any,
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

</script>

<template>
  <ScanProjectFromTestResult v-bind="props" />
</template>
