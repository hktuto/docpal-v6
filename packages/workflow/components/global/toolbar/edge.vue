<script lang="ts" setup>
import { createError } from '#imports'
import { onMounted } from 'vue'

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
    // #region exclusiveGateway
    const allNodeConnected = graphProvider?.graph.value?.getConnectedEdges(source).filter((connectedEdge: any) => {
      // console.log(connectedEdge.source.cell, source.id)
      return connectedEdge.id !== edge.id && connectedEdge.source.cell === source.id
    })

    if (target.data.type === 'boundaryEvent') {
      const sourceID = source.id
      const targetData = target.getData()
      targetData.data.attr_attachedToRef = sourceID
      edge.setData(targetData, { overwrite: true, deep: true })
    }

    // #endregion
    if (source.data.type === 'serviceTask' && source.data.data['attr_flowable:delegateExpression'] === '${conditionValidateDelegate}') {
      let newData = { ...edge.data }
      let label = 'Approved'
      const successLable = source.data.data.extensionElements['docpal:graphLabel']?.attr_successLable || 'true'
      const failureLable = source.data.data.extensionElements['docpal:graphLabel']?.attr_failureLable || 'false'

      // 如果是新的連線，先看看 allNodeConnected 有沒有 conditionValidateDelegate
      if (isNew) {
        if (allNodeConnected.length > 2) {
          // remove edge
          graphProvider.graph.value?.removeEdge(edge.id)
          return
        }
        const hasApprovEdge = allNodeConnected.find((connectedEdge: any) => {
          console.log('connectedEdge', connectedEdge.id, edge.id)
          return connectedEdge.data?.data?.conditionExpression?.__cdata && connectedEdge.data?.data?.conditionExpression?.__cdata === '${conditionResult}'
        })
        console.log('hasApprovEdge', hasApprovEdge)
        newData.data = {
          conditionExpression: {
            ['attr_xsi:type']: 'tFormalExpression',
            __cdata: hasApprovEdge ? '${!conditionResult}' : '${conditionResult}'
          }
        }
        label = hasApprovEdge ? failureLable : successLable
      }

      graphProvider.graph.value?.startBatch('updateEdge')
      edge.setRouter('manhattan')
      edge.setData(newData, { overwrite: true, deep: true })
      if (isNew) {
        edge.setLabels(label)
      }
      graphProvider.graph.value?.stopBatch('updateEdge')
      return
    }
    if (allNodeConnected.length >= 2) {
      console.log('allNodeConnected', allNodeConnected)
      // remove edge
      graphProvider.graph.value?.removeEdge(edge.id)
      return
    }
    // other edge
    if (isNew) {
      console.log('new edge', edge)
      edge.data = {
        data: {
          attr_id: `edge-${edge.id}`,
          attr_sourceRef: edge.source.cell,
          attr_targetRef: edge.target.cell
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
