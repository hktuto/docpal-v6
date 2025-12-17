<template>
  <div style="height: 100%; width: 100%; overflow: hidden">
    <component :is="widgetComponent[componentName]" ref="chartRef" class="echart" mode="mock" :setting="setting"></component>
  </div>
</template>
<script lang="ts" setup>
import { widgetComponent } from '~/utils/dashboardWidgetHelper'
const props = defineProps<{
  componentName: any
  setting: any
}>()
const chartRef = ref()
function init() {
  setTimeout(() => {
    chartRef.value.resize()
  }, 300)
}
onMounted(() => {
  init()
})
defineExpose({
  init
})
</script>
<style lang="scss" scoped></style>
