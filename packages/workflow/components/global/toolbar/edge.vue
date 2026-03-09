<script lang="ts" setup>
import { createError, WorkflowElementType } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

function setupEdge() {
  graphProvider?.graph.value?.on('edge:mouseenter', ({ cell }: any) => {
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

    if (target.data.type === WorkflowElementType.StartEvent) {
      console.log(edge)
      return
    }

    if (isNew) {
      console.log('new edge', edge)
      edge.data = {
        id: `edge-${edge.id}`,
        source_node_id: edge.source.cell,
        target_node_id: edge.target.cell,
        flow_control: {
          type: 'sequence'
        }
      }
      edge.setRouter('manhattan')
    }
  })
}

onMounted(() => {
  setupEdge()
})
</script>

<template>
  <div></div>
</template>
