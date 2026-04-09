<script setup lang="ts">
import type { Node } from '@antv/x6'
import { contextMenuComponentType, getServiceTaskItemConfig } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const editComponent = ref()
const selectedServiceConfig = ref()

const formData = ref<{
  config: any
}>({
  config: {}
})

function init() {
  const data = node.getData()
  const type = data.type as keyof typeof getServiceTaskItemConfig
  if (!(type in contextMenuComponentType)) {
    editComponent.value = null
    selectedServiceConfig.value = null
    return
  }
  editComponent.value = resolveComponent(contextMenuComponentType[type as keyof typeof contextMenuComponentType])
  selectedServiceConfig.value = data.config
}

function update(name: string) {
  graphProvider?.graph.value?.startBatch(name)
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: formData.value.config,
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch(name)
}

type configData = {
  name: string
  config: any
}

function handleUpdateConfig(data: configData) {
  formData.value.config = data.config
  update(data.name)
}

watch(
  () => node,
  () => {
    if (!!node) {
      init()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  init()
})
</script>

<template>
  <SidebarLabel :node="node" />
  <component v-if="editComponent" :is="editComponent" :config="selectedServiceConfig" @update="handleUpdateConfig" />
</template>

<style scoped lang="scss"></style>
