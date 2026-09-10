<script lang="ts" setup>
import type { Node, Edge, Cell } from '@antv/x6'
import { WORKFLOW_EDITOR_PROVIDER } from '#imports'

const opened = ref(false)
const editComponent = ref()
const selectedNode = ref()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

function formatInspectorText(value?: string) {
  if (!value) return 'Properties'
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const inspectorTitle = computed(() => {
  const cell: any = selectedNode.value
  if (!cell) return 'Node Inspector'
  const data = typeof cell.getData === 'function' ? cell.getData() : cell?.data
  return data?.name || formatInspectorText(data?.metadata?.type || cell?.shape)
})

const inspectorSubtitle = computed(() => {
  const cell: any = selectedNode.value
  if (!cell) return 'Select a node to edit its behavior and data mapping.'
  const data = typeof cell.getData === 'function' ? cell.getData() : cell?.data
  return formatInspectorText(data?.metadata?.type || cell?.shape || 'Properties')
})

function openInfo() {
  // get process node
  const id = graphProvider?.workflowJson.value.id
  const cell = graphProvider?.graph.value?.getCellById(id)
  if (!cell) {
    throw createError('Process node not found')
  }
  openSidebar('LazyContextInfo', cell)
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
  openInfo
})
</script>

<template>
  <div :class="{ contextHandler: true, opened }">
    <div class="inspectorHeader">
      <div class="inspectorEyebrow">Inspector</div>
      <div class="inspectorTitle">{{ inspectorTitle }}</div>
      <div class="inspectorSubtitle">{{ inspectorSubtitle }}</div>
    </div>
    <div class="inspectorBody">
      <component v-if="editComponent" :is="editComponent" :node="selectedNode" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.contextHandler {
  position: absolute;
  width: min(408px, calc(100% - var(--app-space-xs) * 2));
  height: calc(100% - var(--app-space-xs) * 2);
  overflow: hidden;
  right: var(--app-space-xs);
  top: var(--app-space-xs);
  z-index: 5;
  background: rgba(247, 248, 250, 0.96);
  backdrop-filter: blur(18px);
  opacity: 0;
  padding: 0;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.14),
    0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateX(100%);
  transition: all 0.2s ease-in-out;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0;

  &.opened {
    transform: translateX(0);
    opacity: 1;
  }

  :deep(.el-form-item__label) {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #475569;
  }
}

.inspectorHeader {
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 248, 250, 0.88) 100%);
}

.inspectorEyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.inspectorTitle {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.inspectorSubtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.inspectorBody {
  min-height: 0;
  overflow: auto;
  padding: 18px 20px 20px;
  scrollbar-width: none;
}

.inspectorBody::-webkit-scrollbar {
  display: none;
}
</style>
