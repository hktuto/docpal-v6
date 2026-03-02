<script setup lang="ts">
import type { Cell, Node, Edge } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { Selection } from '@antv/x6-plugin-selection'
import { Dnd } from '@antv/x6-plugin-dnd'
import { History } from '@antv/x6-plugin-history'

const viewerRef = ref()
const graphOptions = ref()

const ready = ref()
const readonly = ref(false)

// const { readonly } = toRefs()


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

// el
const nodeEl = ref()
const edgeEl = ref()
const graph = ref()
const dnd = ref()

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
    )
    graph.value.cleanHistory()
    dnd.value = new Dnd({
      target: graph.value,
      validateNode: (node: Node, options) => {
        // if(!node.parent) return false
        return !readonly.value
      }
    })*/
}


defineExpose({ init })
</script>

<template>
  <div class="bpmnEditorContainer">
    <WorkflowViewer ref="viewerRef" :options="graphOptions" @graph-ready="graphReady">
      <!--    <div v-if="ready" class="toolbar">-->
      <!--      <div class="group">-->
      <!--        <BpmnHistory />-->
      <!--        <BpmnInfo @click="openInfo" />-->
      <!--        <BpmnPermission @click="openPermission" />-->
      <!--      </div>-->
      <!--      <div v-if="!readonly" class="group">-->
      <!--        <div v-for="(item, index) in dropActionsItems" :key="index" class="icon handlers" @mousedown.native="(ev) => itemDrop(item, ev)">-->
      <!--          <Icon :name="item.icon" />-->
      <!--          <div class="label">{{ item.label }}</div>-->
      <!--        </div>-->
      <!--      </div>-->
      <!--    </div>-->
      <!--    <BpmnSidebar ref="sidebarRef" />-->
      <!--    <BpmnEdge v-if="ready" ref="edgeEl" />-->
      <!--    <BpmnNode v-if="ready" ref="nodeEl" @openForm="openForm" />-->
      <!--    <BpmnXmlEditor-->
      <!--      v-if="ready"-->
      <!--      ref="xmlEl"-->
      <!--      :bpmnXml="bpmn"-->
      <!--      :readonly="readonly"-->
      <!--      @save="handleXmlSave"-->
      <!--      @refresh="handleXmlRefresh"-->
      <!--    />-->
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
</style>