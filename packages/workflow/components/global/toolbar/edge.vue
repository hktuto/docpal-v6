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
  flow_control: {
    type: 'sequence' | 'conditional'
    condition?: string
  }
  label?: string
  metadata: any
}

function setupEdge() {
  graphProvider?.graph.value?.on('edge:dblclick', ({ edge, e }: any) => {
    if (edge.getData().metadata.sourceType !== CellType.conditionTask) return
    // open Sidebar
    graphProvider?.openSidebar('LazyContextEdge', edge)
  })

  graphProvider?.graph.value?.on('edge:mouseenter', ({ cell }: any) => {
    cell.attr('line/stroke', 'var(--app-primary-color)')
    cell.attr('line/strokeDasharray', 5)
    cell.attr('line/style/animation', 'running-line 60s infinite linear')

    if (graphProvider?.readonly.value) return
    // cell.setRouter('normal')

    cell.addTools([
      {
        name: 'vertices',
        args: {
          attrs: { fill: '#666' }
        }
      },
      'segments',
      {
        name: 'target-arrowhead',
        args: {
          attrs: {
            fill: 'red'
          }
        }
      },
      // {
      //   name: 'source-arrowhead',
      //   args: {
      //     attrs: {
      //       fill: 'black'
      //     }
      //   }
      // },
      {
        name: 'button-remove',
        args: {
          distance: -20
        }
      }
    ])
  })

  graphProvider?.graph.value?.on('edge:mouseleave', ({ cell }: any) => {
    cell.attr('line/stroke', '#000')
    cell.attr('line/strokeDasharray', '')
    cell.attr('line/style/animation', '')

    if (graphProvider?.readonly.value) return
    cell.removeTools()
  })


  graphProvider?.graph.value?.on('edge:connected', ({ edge, isNew }) => {
    if (graphProvider?.readonly.value) return
    const source = edge.getSourceCell()
    const target = edge.getTargetCell()
    if (!source || !target) return

    // console.log('----edge:connected edge ', isNew, edge)
    // console.log('----edge:connected source ', source)
    // console.log('----edge:connected target ', target)

    if (!isNew) {
      // update edge
      const data = edge.data
      const newData = {
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
        targetPort: edge.target.port
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

    const allNodeConnected = graphProvider?.graph.value?.getConnectedEdges(source).filter((connectedEdge: any) => {
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
