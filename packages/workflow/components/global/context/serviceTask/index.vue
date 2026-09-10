<script setup lang="ts">
import type { Node } from '@antv/x6'
import { contextMenuComponentType, getTaskItemConfig } from '#imports'

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
  const type = data.metadata.type as keyof typeof getTaskItemConfig
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
  <div class="fromContainer">
    <section class="property-section">
      <div class="section-title">Basic</div>
      <SidebarLabel :node="node" />
    </section>
    <section class="property-section">
      <div class="section-title">Configuration</div>
      <component v-if="editComponent" :is="editComponent" :config="selectedServiceConfig" @update="handleUpdateConfig" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.fromContainer {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.property-section {
  padding-top: var(--app-space-s);
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.section-title {
  margin-bottom: var(--app-space-m);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.property-section :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.property-section :deep(.el-divider) {
  display: none;
}
</style>
