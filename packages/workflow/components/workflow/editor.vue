<script setup lang="ts">
import type { Cell, Node, Edge } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { Selection } from '@antv/x6-plugin-selection'
import { Dnd } from '@antv/x6-plugin-dnd'
import { History } from '@antv/x6-plugin-history'
import { workflowCellElement, workflowElement } from '../../utils/workflowElement'

const viewerRef = ref()
const graphOptions = ref()
const sidebarRef = ref()
const ready = ref()
const readonly = ref(false)

// const { readonly } = toRefs()
const nodeEl = ref()
const edgeEl = ref()
const graph = ref()
const dnd = ref()

function init(workflowJson: any) {
  console.log('init editor', workflowJson)
  // check if ready
  if (ready.value && graph.value) {
    // reset graph
    ready.value = false
    graph.value.dispose()
  }
  graphOptions.value = {
    interacting: !readonly.value,
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown', 'mouseWheel']
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: {
          padding: 3,
          attrs: {
            strokeWidth: 3,
            stroke: '#c41a1a'
          }
        }
      }
    },
    connecting: {
      // router: 'orth',
      connector: 'rounded',
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowNode: true,
      allowMulti: false,
      allowEdge: false,
      highlight: true,
      validateMagnet({ magnet }: any) {
        return !readonly.value
      },
      validateConnection({ sourceMagnet, targetMagnet }: any) {
        return !readonly.value
      }
    }
  }
  nextTick(() => {
    viewerRef.value?.init(workflowJson)
  })
}

const dropActionsItems = computed(() => {
  return Object.values(workflowElement).reduce((acc: any, cur: any) => {
    if (cur.toolbar.length > 0) {
      acc.push(...cur.toolbar)
    }
    return acc
  }, [])
})

function itemDrop(item: any, ev: any) {
  if (readonly.value) return
  console.log(222, item, ev)
  const newData = workflowCellElement.getCellItem(item.id)
  const newNode = graph.value.createNode(newData)
  dnd.value.options.getDragNode = (node: Node) => node
  dnd.value.options.getDropNode = (node: Node) => node.clone({ keepId: true })
  dnd.value.start(newNode, ev)
}

function graphReady() {
  ready.value = true
  graph.value = viewerRef.value.graph
  graph.value.use(
    new Transform({
      resizing: {
        enabled: !readonly.value,
        allowReverse: false
      }
    })
  )

  graph.value.use(
    new Selection({
      enabled: !readonly.value,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
      modifiers: ['shift']
    })
  )
  /*
    graph.value.use(
      new History({
        enabled: !readonly.value,
        beforeAddCommand: (event: any, args: any) => {
          const ignoreKeys = ['tools', 'ports']
          if (ignoreKeys.includes(args.key)) return false
        }
      })
    )*/
  graph.value.cleanHistory()
  dnd.value = new Dnd({
    target: graph.value,
    validateNode: (node: Node, options) => {
      return !readonly.value
    }
  })
}

function openInfo() {}

function openPermission() {}

defineExpose({ init })
</script>

<template>
  <div class="bpmnEditorContainer">
    <WorkflowViewer ref="viewerRef" :options="graphOptions" @graph-ready="graphReady">
      <div v-if="ready" class="toolbar">
        <div class="group">
          <!--          <WorkflowHistory />-->
          <WorkflowInfo @click="openInfo" />
          <!--          <WorkflowPermission @click="openPermission" />-->
        </div>
        <div v-if="!readonly" class="group">
          <div v-for="(item, index) in dropActionsItems" :key="index" class="icon handlers" @mousedown.native="(ev) => itemDrop(item, ev)">
            <Icon :name="item.icon" />
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </div>
      <!--      <WorkflowSidebar ref="sidebarRef" />-->
      <!--      <BpmnEdge v-if="ready" ref="edgeEl" />-->
      <!--      <BpmnNode v-if="ready" ref="nodeEl" @openForm="openForm" />-->
      <!--      <BpmnXmlEditor-->
      <!--        v-if="ready"-->
      <!--        ref="xmlEl"-->
      <!--        :bpmnXml="bpmn"-->
      <!--        :readonly="readonly"-->
      <!--        @save="handleXmlSave"-->
      <!--        @refresh="handleXmlRefresh"-->
      <!--      />-->
    </WorkflowViewer>
  </div>
</template>

<style scoped lang="scss">
.bpmnEditorContainer {
  width: 100%;
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
}

.toolbar {
  position: absolute;
  left: var(--app-space-m);
  top: var(--app-space-m);
  z-index: 2;
  display: flex;
  flex-flow: column nowrap;
  justify-content: stretch;
  align-items: flex-start;
  gap: var(--app-space-xs);
  overflow: hidden;
  transition: all 0.2s ease-in-out;

  .group {
    box-shadow: var(--app-shadow-s);
    color: var(--app-grey-400);
    line-height: 0;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    border-radius: var(--app-border-radius-m);
    border: 1px solid var(--app-grey-800);
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-l);
    padding: var(--app-space-xs);
    background: var(--app-grey-950);
  }

  &:hover,
  &:focus-within {
    :deep(.label) {
      display: block !important;
    }

    :deep(.icon) {
      width: 100%;
    }
  }

  :deep(.icon) {
    border-radius: 0;
    border: 0;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);

    &.handlers {
      cursor: grab;
    }

    &.disabled {
      color: var(--app-grey-700);
      cursor: not-allowed !important;
    }

    cursor: pointer;

    &:hover {
      color: var(--app-main-color);
    }

    .label {
      font-size: var(--app-font-size-s);
      display: none;
    }
  }
}
</style>
