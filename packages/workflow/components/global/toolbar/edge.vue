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
    type: 'sequence' | 'conditional' | 'default'
    condition?: string
  }
  label?: string
}

function setupEdge() {
  graphProvider?.graph.value?.on('edge:dblclick', ({ edge }: any) => {
    graphProvider?.openSidebar('LazyContextGateway', edge)
  })

  graphProvider?.graph.value?.on('edge:mouseenter', ({ cell }: any) => {
    if (graphProvider?.readonly.value) return
    // cell.setRouter('normal')

    cell.addTools([
      ...getGatewayButton(cell),
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
      {
        name: 'source-arrowhead',
        args: {
          attrs: {
            fill: 'black'
          }
        }
      },
      {
        name: 'button-remove',
        args: {
          distance: -20
        }
      }
    ])
  })

  graphProvider?.graph.value?.on('edge:mouseleave', ({ cell }: any) => {
    if (graphProvider?.readonly.value) return
    cell.removeTools()
  })

  graphProvider?.graph.value?.on('edge:connected', ({ edge, isNew }) => {
    if (graphProvider?.readonly.value) return
    const source = edge.getSourceCell()
    const target = edge.getTargetCell()
    if (!source || !target) return

    console.log('----edge:connected edge ', isNew, edge)
    console.log('----edge:connected source ', source)
    console.log('----edge:connected target ', target)

    if (!isNew) {
      // update edge
      const data = edge.data
      const newData = {
        ...data,
        id: `edge-${edge.id}`,
        source_node_id: source.id,
        target_node_id: target.id
      }
      edge.setData(newData, { overwrite: true, deep: true })
      return
    }

    // create new edge
    // TODO: 需要多一個字段用於 用保存進出/出口綫，從cell中的那個點出發。以及該綫是虛綫還是實綫
    const newEdgeData: EdgeData = {
      id: `edge-${edge.id}`,
      source_node_id: edge.source.cell,
      target_node_id: edge.target.cell,
      flow_control: {
        type: 'sequence'
      },
      label: ''
    }

    // type is Gateway
    // TODO: 無法從source區分是那個子節點連接到不同規則
    if (source.data.type === WorkflowElementType.Gateway) {
      newEdgeData.flow_control.type = 'conditional'
      newEdgeData.flow_control.condition = ''
    }
    edge.data = newEdgeData
    edge.setRouter('manhattan')
  })
}

function getGatewayButton(cell: any) {
  if (cell.data?.source_node_id?.includes('Gateway_')) {
    return [
      {
        name: 'button',
        args: {
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: {
                r: 18,
                stroke: '#fe854f',
                strokeWidth: 2,
                fill: 'white',
                cursor: 'pointer'
              }
            },
            {
              tagName: 'text',
              textContent: 'Gateway',
              selector: 'icon',
              attrs: {
                fill: '#fe854f',
                fontSize: 8,
                textAnchor: 'middle',
                pointerEvents: 'none',
                y: '0.3em'
              }
            }
          ],
          distance: 50
        }
      }
    ]
  }
  return []
}

onMounted(() => {
  setupEdge()
})
</script>

<template>
  <div></div>
</template>
