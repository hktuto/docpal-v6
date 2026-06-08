<script setup lang="ts">
import type { Node } from '@antv/x6'
import { useI18n } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()

const form = ref({

})

</script>

<template>
  <div>
    <SidebarLabel :node="node" />
      {{ node.data.metadata.rules }}
  </div>
</template>

<style scoped lang="scss">

</style>
