<script setup lang="ts">
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()

</script>

<template>
  <SidebarLabel :node="node" />
</template>

<style scoped lang="scss">


</style>
