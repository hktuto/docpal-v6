<script lang="ts" setup>
import { CellType, createError, WorkflowElementType } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

type EdgeData = {
  id: string
  source_node_id: string
  target_node_id: string
  flow_control?: {
    type: 'sequence' | 'conditional'
    condition?: string
  }
  label?: string
  metadata: {
    label: string
    conditionStatus: 'success' | 'failure'
    sourceType: string
    targetType: string
    sourcePort: string
    targetPort: string
    vertices: any[]
  }
}

function setEdgeFlowing(edge: any, flowing: boolean) {
  edge.attr({
    line: {
      stroke: flowing ? 'var(--app-primary-color)' : '#000',
      strokeDasharray: flowing ? 5 : 0,
      style: {
        animation: flowing ? 'running-line 30s infinite linear' : ''
      }
    }
  })
}

function setupEdge() {
  graphProvider?.graph.value?.on('edge:dblclick', ({ edge, e }: any) => {
    if (edge.getData().metadata.sourceType !== CellType.conditionTask) return
    // open Sidebar
    graphProvider?.openSidebar('LazyContextEdge', edge)
  })

  graphProvider?.graph.value?.on('edge:mouseenter', ({ cell }: any) => {
    setEdgeFlowing(cell, true)

    if (graphProvider?.readonly.value) return

    cell.addTools([
      {
        name: 'target-arrowhead',
        args: {
          attrs: {
            fill: 'red'
          }
        }
      },
      {
        name: 'vertices',
        args: {
          attrs: { fill: '#666' }
        }
      },
      'segments',
      {
        name: 'button-remove',
        args: {
          distance: -20
        }
      }
    ])
  })

  graphProvider?.graph.value?.on('edge:mouseleave', ({ cell }: any) => {
    if (!graphProvider?.readonly.value) {
      cell.removeTools()
    }
    setEdgeFlowing(cell, false)
  })

  // 拐點事件
  graphProvider?.graph.value?.on('edge:change:vertices', ({ edge }: any) => {
    const data = edge.data
    const newData = {
      ...data,
      metadata: {
        ...data.metadata,
        vertices: edge.vertices
      }
    }
    edge.setData(newData, { overwrite: true, deep: true })
  })

  graphProvider?.graph.value?.on('edge:connected', ({ edge, isNew }) => {
    if (graphProvider?.readonly.value) return
    const source = edge.getSourceCell()
    const target = edge.getTargetCell()
    if (!source || !target) return

    if (!isNew) {
      // update edge
      const data: EdgeData = edge.data
      const newData: EdgeData = {
        ...data,
        id: `edge-${edge.id}`,
        source_node_id: source.id,
        target_node_id: target.id,
        metadata: {
          ...data.metadata,
          sourceType: source.getData().metadata.type,
          targetType: target.getData().metadata.type,
          sourcePort: edge.source.port,
          targetPort: edge.target.port
        }
      }
      edge.setData(newData, { overwrite: true, deep: true })
      return
    }

    // create new edge
    const newEdgeData: EdgeData = {
      id: `edge-${edge.id}`,
      source_node_id: edge.source.cell,
      target_node_id: edge.target.cell,
      flow_control: {
        type: 'sequence'
      },
      metadata: {
        label: '',
        conditionStatus: 'success',
        sourceType: source.getData().metadata.type,
        targetType: target.getData().metadata.type,
        sourcePort: edge.source.port,
        targetPort: edge.target.port,
        vertices: []
      }
    }

    // type is Gateway
    if (source.data.metadata.tags === WorkflowElementType.Gateway) {
      const metadata = source.data.metadata
      newEdgeData.flow_control.condition = ''

      // Exclusive or Inclusive Gateway 的出綫必須是 'conditional',
      if (metadata.type === CellType.exclusiveGateway || metadata.type === CellType.inclusiveGateway) {
        newEdgeData.flow_control.type = 'conditional'
      }
    }

    const allNodeConnected: any[] = graphProvider?.graph.value?.getConnectedEdges(source).filter((connectedEdge: any) => {
      return connectedEdge.id !== edge.id && connectedEdge.source.cell === source.id
    })

    // Set Label to condition edge
    if (newEdgeData.metadata.sourceType === CellType.conditionTask) {
      newEdgeData.metadata.label = 'Success'
      if (isNew) {
        if (allNodeConnected.length > 0) {
          newEdgeData.metadata.conditionStatus = 'failure'
          newEdgeData.metadata.label = 'Failure'
        }
        edge.setLabels(newEdgeData.metadata.label)
      }
    }

    edge.data = newEdgeData
    edge.setRouter('manhattan')
  })
}

onMounted(() => {
  setupEdge()
})
</script>

<template>
  <div></div>
</template>
