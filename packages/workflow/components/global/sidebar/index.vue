<script lang="ts" setup>
import type { Node, Edge, Cell } from '@antv/x6'
import { WORKFLOW_EDITOR_PROVIDER } from '#imports'

const opened = ref(false)
const editComponent = ref()
const selectedNode = ref()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
const activeTab = ref('properties')
if (!graphProvider) {
  throw createError('graph provider not found')
}

function openInfo() {
  // get process node
  const id = graphProvider?.workflowJson.value.id
  const cell = graphProvider?.graph.value?.getCellById(id)
  if (!cell) {
    throw createError('Process node not found')
  }
  openSidebar('LazyContextInfo', cell)
}

function openPermission() {
  const id = graphProvider?.workflowJson.value.id
  const cell = graphProvider?.graph.value?.getCellById(id)
  if (!cell) {
    throw createError('Process node not found')
  }
  graphProvider?.openSidebar('LazyContextPermission', cell)
}

function openSidebar(component: string, node: Node | Cell | Edge) {
  editComponent.value = resolveComponent(component)
  selectedNode.value = node
  opened.value = true
}

function closeSidebar() {
  opened.value = false
  editComponent.value = null
  selectedNode.value = null
}

defineExpose({
  openSidebar,
  closeSidebar,
  openInfo,
  openPermission
})
</script>

<template>
  <div :class="{ contextHandler: true, opened }">
    <div class="propertiesHeader" @click="opened = false">
      <Icon name="lucide:settings-2" />
      Properties
    </div>
    <!-- tabs container -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="Properties" name="properties">
        <component v-if="editComponent" :is="editComponent" :node="selectedNode" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.contextHandler {
  position: absolute;
  width: 332px;
  height: calc(100% - var(--app-space-xs) * 2);
  overflow: auto;
  right: var(--app-space-xs);
  top: var(--app-space-xs);
  z-index: 2;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  opacity: 0;
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
  transform: translateX(100%);
  transition: all 0.2s ease-in-out;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);

  &.opened {
    transform: translateX(0);
    opacity: 1;
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.opened {
  opacity: 1;
}
</style>
