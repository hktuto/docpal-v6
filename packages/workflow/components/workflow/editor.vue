<script setup lang="ts">
import { type Cell, type Node, type Edge, Graph } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { Selection } from '@antv/x6-plugin-selection'
import { Dnd } from '@antv/x6-plugin-dnd'
import { History } from '@antv/x6-plugin-history'
import {
  MenuRouterKey,
  useVariables,
  WORKFLOW_EDITOR_PROVIDER,
  workflowJsonToX6Node,
  workflowCellElement,
  workflowElement,
  type WorkflowJson,
  WorkflowElementType,
  CellType,
  x6NodeToWorkflowJson
} from '#imports'
import { clientApi } from 'api'

const { setVariables } = useVariables()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps<{
  workflowData: any
  readonly: boolean
  showSidebar: boolean
  isActivate?: boolean
}>()
const { workflowData: workflowJsonObject, readonly, showSidebar, isActivate } = toRefs(props)
const isNew = ref<boolean>(false)

const sidebarRef = ref()
const nodeRef = ref()
const edgeRef = ref()
const graph = ref<Graph>()
const dnd = ref()
const containerEl = ref()
const workflowJson = ref<WorkflowJson>({
  id: '',
  key: '',
  name: '',
  type: '',
  version: 1,
  description: '',
  nodes: [],
  edges: [],
  variables: {},
  metadata: {
    created_date: '',
    version: '',
    author: '',
    purpose: '',
    status: '',
    tags: []
  }
})
const workflowId = ref<string>('')
const workflowKey = ref<string>('')
const version = ref<number>(0)
const emits = defineEmits(['refresh', 'updateActivate'])
const RULER_STEP = 100
const RULER_COUNT = 40
const rulerMarks = Array.from({ length: RULER_COUNT + 1 }, (_, index) => index * RULER_STEP)

const dropActionsItems = computed(() => {
  return Object.values(workflowElement).reduce((acc: any, cur: any) => {
    if (cur.toolbar.length > 0) {
      acc.push(...cur.toolbar)
    }
    return acc
  }, [])
})
const isReady = ref(false)

const NODE_TYPES = new Set<string>([WorkflowElementType.Gateway, CellType.conditionTask, 'ExclusiveGateway', 'ParallelGateway', 'InclusiveGateway'])

function init() {
  try {
    if (!workflowJsonObject.value) {
      throw new Error('workflowJsonObject is not found')
    }

    // dispose graph
    if (!!graph.value) {
      isReady.value = false
      graph.value.dispose()
    }
    const graphOptions = {
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
        validateMagnet({ e, magnet, view, cell }) {
          if (readonly.value) {
            return false
          }

          const nodeType = cell.getData().metadata.type
          // 限制特定類型的 node 出綫
          if (NODE_TYPES.has(nodeType)) {
            const outgoingEdges = graph.value?.getConnectedEdges(cell, { outgoing: true })
            if (outgoingEdges.length === cell.getData().metadata.maxOutgoing) {
              return false
            }
          }
          return true
        },
        validateConnection({ sourceMagnet, targetMagnet }: any) {
          return !readonly.value
        }
      }
    }
    if (!containerEl.value) {
      throw new Error('Container is not found')
    }

    // step 4 - init graph
    const initGraphOptions: any = Object.assign(
      {
        container: containerEl.value,
        grid: {
          visible: true,
          type: 'mesh',
          args: {
            color: '#d8dee9',
            thickness: 1
          }
        },
        scaling: {
          min: 0.005,
          max: 2
        },
        background: {
          color: '#f8fafc'
        },
        autoResize: true,
        panning: {
          enabled: true,
          eventTypes: ['leftMouseDown', 'mouseWheel']
        },
        embedding: {
          enabled: false
        },
        mousewheel: {
          enabled: true,
          factor: 1.05,
          modifiers: ['ctrl', 'meta']
        },
        connecting: {
          connector: 'rounded',
          allowMulti: false
        },
        interacting: false
      },
      graphOptions
    )
    graph.value = new Graph({
      container: containerEl,
      ...initGraphOptions
    })

    workflowJson.value = workflowJsonObject.value
    workflowId.value = workflowJsonObject.value.id
    workflowKey.value = workflowJsonObject.value.key
    version.value = workflowJsonObject.value.version
    setVariables(workflowJsonObject.value.variables)
    const json = workflowJsonToX6Node(workflowJsonObject.value)

    nextTick(() => {
      graph.value?.fromJSON(json)
      // remove all tools
      graph.value?.getNodes().forEach((node: any) => {
        node.removeTools()
        const ports = node.getPorts() || []
        ports.forEach((port: any) => {
          node.setPortProp(port.id, 'attrs/circle', {
            fill: 'transparent',
            stroke: 'transparent'
          })
        })
      })
      graph.value?.getEdges().forEach((edge: any) => {
        edge.removeTools()
      })

      // Set Edges Setting to X6Edge
      workflowJsonObject.value.edges.forEach((edge: any) => {
        const edgeMetadata = edge.metadata || {}
        graph.value?.addEdge({
          source: { cell: edge.source_node_id, port: edgeMetadata.sourcePort || 'to' },
          target: { cell: edge.target_node_id, port: edgeMetadata.targetPort || 'from' },
          vertices: edgeMetadata.vertices ?? [],
          attrs: {
            line: {
              stroke: '#000000',
              strokeWidth: 2,
              strokeDasharray: 0
            }
          },
          label: edgeMetadata.label || null,
          data: { ...edge, metadata: edgeMetadata },
          router: {
            name: 'manhattan'
          }
        })
      })
      fitIn()
      graphReady()
      graph.value?.centerContent()
    })
  } catch (e) {
    console.log(e)
  }
}

function fitIn() {
  if (window.innerWidth >= 1280) {
    graph.value?.zoomToFit({ padding: 100 })
  }
  graph.value?.zoomToFit({ padding: 40 })
  // get current zoom level
  const currentZoom = graph.value?.zoom()
  if (!currentZoom || currentZoom < 0.3) {
    graph.value?.zoom(0.35)
  }
}

// loading component
function graphReady() {
  graph.value?.use(
    new Transform({
      resizing: {
        enabled: !readonly.value,
        allowReverse: false
      }
    })
  )
  graph.value?.use(
    new Selection({
      enabled: !readonly.value,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true,
      modifiers: ['shift'],
      // 连线不进入选中态，避免 toFront 后挡住其他节点/连线点击
      filter: (cell) => cell.isNode()
    })
  )
  graph.value?.use(
    new History({
      enabled: !readonly.value,
      beforeAddCommand: (event: any, args: any) => {
        if (args.options?.ignoreHistory) return false

        const ignoreKeys = ['tools', 'ports']
        if (ignoreKeys.includes(args.key)) return false
      }
    })
  )
  graph.value?.cleanHistory()
  dnd.value = new Dnd({
    target: graph.value,
    validateNode: (node: Node, options) => {
      return !readonly.value
    }
  })
  isReady.value = true
}

function itemDrop(item: any, ev: any) {
  if (readonly.value) return
  const newData = workflowCellElement.getCellItem(item.id)
  const newNode = graph.value?.createNode(newData)
  dnd.value.options.getDragNode = (node: Node) => node
  dnd.value.options.getDropNode = (node: Node) => node.clone({ keepId: true })
  dnd.value.start(newNode, ev)
}

function openInfo() {
  sidebarRef.value?.openInfo()
}

function openSidebar(component: string, node: Node | Edge | Cell) {
  console.log('openSidebar', component, node)
  sidebarRef.value.openSidebar(component, node)
}

function closeSidebar() {
  sidebarRef.value.closeSidebar()
}

const copyKey = useState('copy-key', () => '')
const copyObj = useState('copy-obj')

async function copyForm(node: Node, nodeSetting: any) {
  copyKey.value = node.data.id
  copyObj.value = nodeSetting
  routerProvider?.message.success(`${node.data.name || node.data.id} form has copied`)
}

function pasteForm(node: Node) {
  graph.value?.startBatch('paste-update-from-data')
  const data = node.getData()
  const newData = {
    ...data,
    config: copyObj.value?.config,
    metadata: copyObj.value?.metadata,
    version: (data.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graph.value?.stopBatch('paste-update-from-data')
}

function handelReplayViewer() {
  isReady.value = false
  showSidebar.value = false
}

function dim(cellIds: string[]) {
  const nodes = graph.value?.getNodes()
  nodes?.forEach((node: Node) => {
    //if node.id is not include in cellIds,
    if (!cellIds.includes(node.id)) {
      if (node.data.type === 'ConditionTask') {
        const allNodeConnectedToExclusiveGateway = graph.value?.getConnectedEdges(node)
        let isAllConnectedNodeDone = true
        allNodeConnectedToExclusiveGateway?.forEach((connectedEdge: any) => {
          if (connectedEdge.source.cell === node.id) {
            if (!cellIds.includes(connectedEdge.target.cell)) {
              isAllConnectedNodeDone = false
            }
          } else if (connectedEdge.target.cell === node.id) {
            if (!cellIds.includes(connectedEdge.source.cell)) {
              isAllConnectedNodeDone = false
            }
          }
        })
        if (!isAllConnectedNodeDone) {
          allNodeConnectedToExclusiveGateway?.forEach((edge: any) => {
            edge.attr('line/stroke', '#ccc')
            edge.attr('line/strokeDasharray', '')
            edge.attr('line/style/animation', '')
          })
          node.attr('body/fill', '#ccc')
          node.attr('body/stroke', '#ccc')
        }
      } else {
        node.attr('body/fill', '#ccc')
        node.attr('body/stroke', '#ccc')
        // dim connection
        const edges = graph.value?.getConnectedEdges(node)
        edges?.forEach((edge) => {
          edge.attr('line/stroke', '#ccc')
          edge.attr('line/strokeDasharray', '')
          edge.attr('line/style/animation', '')
        })
      }
    } else {
      nodes?.forEach((node: Node) => {
        const view = graph.value?.findView(node)
        view?.unhighlight(null)
        // dim connection
        const edges = graph.value?.getConnectedEdges(node)
        edges?.forEach((edge) => {
          edge.attr('line/stroke', '#000')
          edge.attr('line/strokeDasharray', '')
          edge.attr('line/style/animation', '')
        })
      })
    }
  })
}

function highlightCell(cellIds: string[], allNodes: string[]) {
  dim(allNodes)
  if (cellIds && cellIds.length > 0) {
    cellIds.forEach((id) => {
      const node: any = graph.value?.getCellById(id)
      const view = graph.value?.findView(node)
      view?.highlight(null, {
        // @ts-ignore
        name: 'className'
      })
      // highlight connected edge
      const edges = graph.value?.getConnectedEdges(node)
      edges?.forEach((edge: any) => {
        if (allNodes.includes(edge.source.cell) && allNodes.includes(edge.target.cell)) {
          edge.attr('line/stroke', 'var(--app-primary-color)')
          edge.attr('line/strokeDasharray', 5)
          edge.attr('line/style/animation', 'running-line 30s infinite linear')
          return
        }
        // check if edge source is exclusive gateway or boundary event
        const sourceNode = graph.value?.getCellById(edge.source.cell)
        const targetNode = graph.value?.getCellById(edge.target.cell)
        if (sourceNode?.data.type === 'exclusiveGateway' || sourceNode?.data.type === 'boundaryEvent') {
          // find edge connected to this source
          const allNodeConnectedToExclusiveGateway = graph.value?.getConnectedEdges(sourceNode)
          allNodeConnectedToExclusiveGateway?.forEach((connectedEdge: any) => {
            if (connectedEdge.target.cell === sourceNode.id) {
              if (allNodes.includes(connectedEdge.source.cell)) {
                edge.attr('line/stroke', 'var(--app-primary-color)')
                edge.attr('line/strokeDasharray', 5)
                edge.attr('line/style/animation', 'running-line 30s infinite linear')
              }
            }
          })
        } else if (targetNode?.data.type === 'exclusiveGateway' || targetNode?.data.type === 'boundaryEvent') {
          // if sourceNode is include in allNodes
          const allNodeConnectedToExclusiveGateway: any = graph.value?.getConnectedEdges(targetNode)
          allNodeConnectedToExclusiveGateway.forEach((connectedEdge: any) => {
            if (connectedEdge.source.cell === targetNode.id) {
              if (allNodes.includes(connectedEdge.target.cell)) {
                edge.attr('line/stroke', 'var(--app-primary-color)')
                edge.attr('line/strokeDasharray', 5)
                edge.attr('line/style/animation', 'running-line 30s infinite linear')
              }
            }
          })
        }
      })
    })
  }
}

async function saveWorkflowJSON() {
  if (!graph.value) {
    throw new Error('graph is undefined')
  }
  // check if workflow is empty
  if (!graph.value.getNodes() && graph.value.getNodes().length === 0) return

  if (!workflowId.value || workflowId.value === '') {
    throw new Error('Workflow ID is null')
  }

  // 修改時，檢查是否已激活
  if (isActivate.value) {
    await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/deactivate`).then((r: any) => r.data)
    isActivate.value = false
  }

  // update workflow Json Data
  try {
    const newWorkflowJson = x6NodeToWorkflowJson(graph.value, workflowJson.value)
    await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}`, newWorkflowJson).then((r: any) => r.data)
    workflowJson.value = newWorkflowJson
    isNew.value = false
  } catch (e) {
    routerProvider?.message.error(e)
    console.log(e)
  }
}

function updateStatus() {
  isNew.value = true
}

provide(WORKFLOW_EDITOR_PROVIDER, {
  workflowId,
  workflowKey,
  workflowJson,
  saveWorkflowJSON,
  graph,
  copyKey,
  readonly,
  openSidebar,
  closeSidebar,
  pasteForm,
  copyForm,
  updateStatus
})

watch(
  () => workflowJsonObject.value,
  async () => {
    init()
  }
)

defineExpose({ init, workflowJson, isNew, saveWorkflowJSON, handelReplayViewer, highlightCell, graph, dim })
</script>

<template>
  <div class="bpmnEditorContainer">
    <div class="bpmnViewerContainer">
      <div class="rulerOrigin">0</div>
      <div class="ruler ruler--top" aria-hidden="true">
        <span v-for="mark in rulerMarks" :key="`top-${mark}`" class="ruler__mark" :style="{ left: `${mark}px` }">
          {{ mark }}
        </span>
      </div>
      <div class="ruler ruler--left" aria-hidden="true">
        <span v-for="mark in rulerMarks" :key="`left-${mark}`" class="ruler__mark" :style="{ top: `${mark}px` }">
          {{ mark }}
        </span>
      </div>
      <div class="bpmnGraphStage">
        <div class="bpmnGraphContainer" ref="containerEl" />
      </div>
      <div v-if="isReady" class="toolbar">
        <div v-if="!readonly" class="group">
          <ToolbarHistory />
          <ToolbarInfo @click="openInfo" />
        </div>
        <div v-if="!readonly" class="group">
          <div v-for="(item, index) in dropActionsItems" :key="index" class="icon handlers" @mousedown.native="(ev) => itemDrop(item, ev)">
            <Icon :name="item.icon" />
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
        <ToolbarEdge ref="edgeRef" />
        <ToolbarNode ref="nodeRef" />
      </div>
    </div>

    <div class="actions">
      <slot name="actions" />
    </div>
  </div>
  <Sidebar v-if="showSidebar" ref="sidebarRef" />
</template>

<style scoped lang="scss">
.bpmnEditorContainer {
  --workflow-ruler-size: 28px;
  width: 100%;
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
}

.bpmnEditorContainer {
  min-height: 0;
}

.bpmnViewerContainer {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 12px 28px rgba(15, 23, 42, 0.08);
}

.rulerOrigin {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--workflow-ruler-size);
  height: var(--workflow-ruler-size);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.94);
  color: #475569;
  font-size: 10px;
  font-weight: 700;
}

.ruler {
  position: absolute;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
  color: #64748b;
  pointer-events: none;
}

.ruler--top {
  left: var(--workflow-ruler-size);
  top: 0;
  right: 0;
  height: var(--workflow-ruler-size);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background-image:
    repeating-linear-gradient(to right, rgba(15, 23, 42, 0.18) 0, rgba(15, 23, 42, 0.18) 1px, transparent 1px, transparent 20px),
    repeating-linear-gradient(to right, rgba(15, 23, 42, 0.32) 0, rgba(15, 23, 42, 0.32) 1px, transparent 1px, transparent 100px);
}

.ruler--left {
  left: 0;
  top: var(--workflow-ruler-size);
  bottom: 0;
  width: var(--workflow-ruler-size);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  background-image:
    repeating-linear-gradient(to bottom, rgba(15, 23, 42, 0.18) 0, rgba(15, 23, 42, 0.18) 1px, transparent 1px, transparent 20px),
    repeating-linear-gradient(to bottom, rgba(15, 23, 42, 0.32) 0, rgba(15, 23, 42, 0.32) 1px, transparent 1px, transparent 100px);
}

.ruler__mark {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}

.ruler--top .ruler__mark {
  top: 7px;
  transform: translateX(-50%);
}

.ruler--left .ruler__mark {
  left: 7px;
  transform: translateY(-50%);
}

.bpmnGraphStage {
  position: absolute;
  left: var(--workflow-ruler-size);
  top: var(--workflow-ruler-size);
  right: 0;
  bottom: 0;
  overflow: hidden;
  cursor: grab;
}

.bpmnGraphStage:active {
  cursor: grabbing;
}

.bpmnGraphContainer {
  width: 100%;
  height: 100%;
  touch-action: none;
}

.toolbar {
  position: absolute;
  left: calc(var(--workflow-ruler-size) + var(--app-space-m));
  top: calc(var(--workflow-ruler-size) + var(--app-space-m));
  z-index: 4;
  display: flex;
  flex-flow: column nowrap;
  justify-content: stretch;
  align-items: flex-start;
  gap: var(--app-space-xs);
  overflow: hidden;
  transition: all 0.2s ease-in-out;

  .group {
    box-shadow: var(--app-shadow-s);
    color: #475569;
    line-height: 0;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    border-radius: var(--app-border-radius-m);
    border: 1px solid rgba(15, 23, 42, 0.08);
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-l);
    padding: var(--app-space-xs);
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
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
.actions {
  padding: var(--app-space-xs);
}
</style>

<style>
@keyframes running-line {
  to {
    stroke-dashoffset: -1000;
  }
}

.x6-highlight-stroke {
  stroke: var(--app-main-color) !important;
  stroke-dasharray: 5;
  animation: running-line 60s infinite linear;
}

.bpmnGraphContainer::-webkit-scrollbar,
.x6-graph::-webkit-scrollbar,
.x6-graph-scroller::-webkit-scrollbar {
  display: none;
}
</style>
