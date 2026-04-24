<script lang="ts" setup>
import { createError, workflowElement, WorkflowElementType } from '#imports'
import { onClickOutside } from '@vueuse/core'
import { ElPopconfirm } from 'element-plus'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const ignoreTypeList: string[] = []

function setupNode() {
  graphProvider?.graph.value?.on('blank:dblclick', () => {
    graphProvider?.graph.value?.zoomToFit({
      padding: 24
    })
    const currentZoom = graphProvider?.graph.value?.zoom()
    console.log('currentZoom', currentZoom)
    if (currentZoom && currentZoom < 0.18) {
      graphProvider?.graph.value?.zoom(0.16)
    }
  })

  graphProvider?.graph.value?.on('node:mouseenter', ({ cell }: any) => {
    if (graphProvider?.readonly.value) return

    if (cell.getData().metadata.type === CellType.conditionTask) {
      const allNodeConnected = graphProvider?.graph.value?.getConnectedEdges(cell).filter((connectedEdge: any) => {
        return connectedEdge.source.cell === cell.id
      })
      // 當超出node設定的最大連出綫，該節點不在顯示節點標識符
      if (allNodeConnected.length === cell.getData().metadata.maxOutgoing) return
    }

    // 获取该节点下的所有连接桩
    const ports = cell.getPorts() || []
    ports.forEach((port: any) => {
      cell.setPortProp(port.id, 'attrs/circle', {
        fill: '#fff',
        stroke: '#85A5FF'
      })
    })
  })

  graphProvider?.graph.value?.on('node:mouseleave', ({ cell }: any) => {
    if (graphProvider?.readonly.value) return
    // 获取该节点下的所有连接桩
    const ports = cell.getPorts() || []
    ports.forEach((port: any) => {
      cell.setPortProp(port.id, 'attrs/circle', {
        fill: 'transparent',
        stroke: 'transparent'
      })
    })
  })

  graphProvider?.graph.value?.on('node:dblclick', handleNodeClick)

  graphProvider?.graph.value?.on('node:contextmenu', contextMenuHandler)
}

// #region context menu
const position = ref({ x: 0, y: 0 })
const contextMenuOpened = ref(false)
const contextSelectedNode = ref()
const rightClickEl = ref()

function contextMenuHandler({ e, view, node }: any) {
  if (graphProvider?.readonly.value) return
  if (ignoreTypeList.includes(node.data.type || '')) {
    return
  }
  console.log('contextMenuHandler', node)
  contextSelectedNode.value = node
  // clientX and ClientY should relative to the routerContainer
  const x = e.clientX
  const y = e.clientY
  position.value = {
    x,
    y
  }
  contextMenuOpened.value = true
}

function deleteItem() {
  const id = contextSelectedNode.value.id
  graphProvider?.graph.value?.removeNode(id)
  contextMenuOpened.value = false
  graphProvider?.closeSidebar()
}

function editItem() {
  contextMenuOpened.value = false
  handleNodeClick({ node: contextSelectedNode.value })
}

onClickOutside(rightClickEl, () => {
  contextMenuOpened.value = false
})
// #endregion

function handleNodeClick({ node }: any) {
  const type = node.data.metadata.tags as WorkflowElementType
  if (type === WorkflowElementType.Gateway) {
    graphProvider?.closeSidebar()
    return
  }

  if (type) {
    const workflowElementType = workflowElement[type]
    if (workflowElementType.contextMenuComponent) {
      let element
      if (typeof workflowElementType.contextMenuComponent === 'string') {
        element = workflowElementType.contextMenuComponent
      } else {
        element = workflowElementType.contextMenuComponent(node.data)
      }
      if (!!element) {
        graphProvider?.openSidebar(element, node)
      }
    }
  }
}

async function copy() {
  const data = contextSelectedNode.value.data
  const field = data.data.extensionElements['flowable:formProperty'] || []
  const fields = JSON.parse(JSON.stringify(field))
  const form = await graphProvider?.getFormByNode(contextSelectedNode.value)
  graphProvider?.copyForm(contextSelectedNode.value, {
    fields,
    form
  })
}

function paste() {
  graphProvider?.pasteForm(contextSelectedNode.value)
}

onMounted(() => {
  setupNode()
})
</script>

<template>
  <div ref="rightClickEl" :class="{ workflowContextMenuContainer: true, show: contextMenuOpened }" :style="`--x: ${position.x}px; --y: ${position.y}px`">
    <div class="contextAction" @click="editItem">
      <Icon name="lucide:settings-2" />
      <div class="label">Edit</div>
    </div>
    <div
      class="contextAction"
      v-if="contextSelectedNode && ![WorkflowElementType.StartEvent, WorkflowElementType.EndEvent].includes(contextSelectedNode.data.type)"
      @click="copy"
    >
      <Icon name="lucide:clipboard-copy" />
      <div class="label">Copy</div>
    </div>
    <div
      class="contextAction"
      v-if="
        contextSelectedNode &&
        [WorkflowElementType.UserTask, WorkflowElementType.StartEvent].includes(contextSelectedNode.data.type) &&
        graphProvider.copyKey.value &&
        graphProvider.copyKey.value !== contextSelectedNode.data.id
      "
      @click="paste"
    >
      <Icon name="lucide:clipboard-paste" />
      <div class="label">Paste</div>
    </div>
    <el-popconfirm
      v-if="contextSelectedNode && ![WorkflowElementType.StartEvent, WorkflowElementType.EndEvent].includes(contextSelectedNode.data.type)"
      title="Are you sure to delete this item?"
      @confirm="deleteItem"
    >
      <template #reference>
        <div class="contextAction">
          <Icon name="lucide:trash" />
          <div class="label">Delete</div>
        </div>
      </template>
    </el-popconfirm>
  </div>
</template>

<style scoped lang="scss">
.workflowContextMenuContainer {
  position: fixed;
  z-index: 10;
  background-color: var(--app-grey-950);
  border-radius: 4px;
  box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.3);
  padding-block: 8px;
  display: none;
  left: var(--x);
  top: var(--y);
  transform: translateX(0);
  &.show {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0;
  }
}
.contextAction {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  padding: var(--app-space-xs) var(--app-space-xs);
  &:hover {
    color: var(--app-main-color);
  }
  .label {
    font-size: var(--app-font-size-s);
  }
  & + & {
    border-top: 1px solid var(--app-grey-800);
  }
}
.propertiesHeader {
  width: 100%;
  padding-block: var(--app-space-xs);
  border-bottom: 1px solid var(--app-grey-800);
}
.contextHandler {
  position: absolute;
  width: 280px;
  height: calc(100% - var(--app-space-xs) * 2);
  overflow: auto;
  right: var(--app-space-xs);
  top: var(--app-space-xs);
  z-index: 2;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  opacity: 0;
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-m);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transform: translateX(100%);
  transition: all 0.2s ease-in-out;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
  &.opened {
    transform: translateX(0);
    opacity: 1;
  }
}
.opened {
  opacity: 1;
}
</style>
