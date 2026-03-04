<script lang="ts" setup>
import { workflowJsonToX6Node, WORKFLOW_PROVIDER } from '#imports'
import { Graph, type Node } from '@antv/x6'
import { DagreLayout } from '@antv/layout'

const containerEl = ref()
const graph = ref<Graph>()

const { options = {} } = defineProps<{
  options?: any
}>()
const emits = defineEmits(['graphReady'])
const flatGraphObject = ref<any>({})
const graphJson = ref<any>({})

function init(workflowJson: any) {
  if (!containerEl.value) {
    throw new Error('Container is not found')
  }
  if (!workflowJson) {
    throw new Error('workflowJson is not found')
  }
  if (graph.value) {
    graph.value.dispose()
  }

  // step 4 - init graph
  const graphOptions = Object.assign(
    {
      container: containerEl.value,
      grid: {
        visible: true,
        type: 'mesh',
        args: {
          color: '#eee',
          thickness: 1
        }
      },
      scaling: {
        min: 0.005,
        max: 2
      },
      background: {
        color: 'var(--app-grey-9000)'
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
    options
  )
  graph.value = new Graph({
    container: containerEl,
    ...graphOptions
  })

  const json = workflowJsonToX6Node(workflowJson)
  graphJson.value = json

  graph.value.fromJSON(json)
  // remove all tools
  graph.value.getNodes().forEach((node: any) => {
    node.removeTools()
    const ports = node.getPorts() || []
    ports.forEach((port: any) => {
      node.setPortProp(port.id, 'attrs/circle', {
        fill: 'transparent',
        stroke: 'transparent'
      })
    })
  })
  graph.value.getEdges().forEach((edge: any) => {
    edge.removeTools()
  })
  nextTick(fitIn)

  // autoLayout(bpmnXml)

  allFormField.value = getAllFormFieldFromGraph(graph.value)

  graph.value.on('history:change', () => {
    allFormField.value = getAllFormFieldFromGraph(graph.value as any)
  })

  emits('graphReady', workflowJson)
}

function dim(cellIds: string[]) {
  const nodes = graph.value?.getNodes()
  nodes?.forEach((node: Node) => {
    //if node.id is not include in cellIds,
    if (!cellIds.includes(node.id)) {
      if (node.data.type === 'exclusiveGateway' || node.data.type === 'boundaryEvent') {
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

function autoLayout(xml: string) {
  /*  const { json, flatObj } = bpmnStringToJson(xml)
    // flatGraphObject.value = flatObj
    graphJson.value = json
    const layout = new DagreLayout({
      type: 'dagre',
      rankdir: 'TB',
      ranksep: 40,
      nodesep: 40
    })
    const result = workflowJsonToX6Node(graphJson.value, flatGraphObject.value)
    const position = layout.layout(result)
    graph.value?.fromJSON(position)
    // check window width, if width is more than 1024, zoom graph with padding 200, more than 1280 with padding 300
    nextTick(fitIn)*/
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

const allFormField = ref({})

function handleSave() {
  try {
    let nodes = graph.value?.getNodes()
    console.log(123, nodes)
  } catch (e) {
    console.log(e)
  }
}

provide(WORKFLOW_PROVIDER, {
  init,
  graph,
  graphJson,
  flatGraphObject,
  allFormField,
  key: Symbol('WORKFLOW_PROVIDER_KEY')
})

defineExpose({
  init,
  graph,
  graphJson,
  allFormField,
  autoLayout,
  highlightCell,
  dim
})
</script>

<template>
  <div class="bpmnViewerContainer">
    <el-button @click="handleSave">Save</el-button>
    <div class="bpmnGraphContainer" ref="containerEl"></div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.bpmnViewerContainer {
  width: 100%;
  height: 1000px;
  border: 1px solid #eee;
  overflow: hidden;

  > .bpmnGraphContainer {
    width: 100%;
    height: 100%;
  }
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
</style>
