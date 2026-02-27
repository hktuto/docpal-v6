<script lang="ts" setup>
import {Graph, Node} from '@antv/x6'
import { useEventListener} from '@vueuse/core'
const props = defineProps({
    graph: Graph,
    caseNode: Node
})
const nodeData = ref(props.caseNode);
const nodeType = ref("case");

function nodeClickHandler({detail}) {
    if(!detail?.data?.type){
        nodeType.value = 'case'
        nodeData.value = props.caseNode
        return
    }
    nodeType.value = detail?.data?.type
    nodeData.value = detail
    
}
const editComponent = computed(() => {
    switch(nodeType.value){
        case 'humanTask':
            return resolveComponent('LazyCmmnSidePanelHumanTask')
        case 'processTask':
            return resolveComponent('LazyCmmnSidePanelProcessTask')
        case 'exitCriterion':
            return resolveComponent('LazyCmmnSidePanelExitCriterion')
        case 'entryCriterion':
            return resolveComponent('LazyCmmnSidePanelEntryCriterion')
        case 'userEventListener':
            return resolveComponent('LazyCmmnSidePanelUserEventListener')
        case 'caseTask':
            return resolveComponent('LazyCmmnSidePanelCaseTask')
        case 'milestone':
            return resolveComponent('LazyCmmnSidePanelMilestone')
        case 'stage':
            return resolveComponent('LazyCmmnSidePanelStage')
        default:
            return resolveComponent('LazyCmmnSidePanelCase')
    }
})

useEventListener(window, 'cmmn-node-click', nodeClickHandler)
</script>

<template>
    <div class="sideBarContainer">
        <component ref="comRef" :is="editComponent" :graph="graph" :node="nodeData || caseNode" />
    </div>
</template>

<style scoped lang="scss">
.sideBarContainer{
    top:0;
    right:0;
    z-index: 99;
    width:100%;
    height:100%;
    overflow: auto;
    padding: var(--app-space-xs, 12px);
    background: var(--app-grey-950, white);
}
.position-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
}
</style>
