<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const emits = defineEmits(['openForm'])
const editorProvider = inject(EDITOR_PROVIDER)
if (!editorProvider) {
  throw createError('graph provider not found')
}
const switchRef = ref(true)

function handleSwitch() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }

  if (switchRef.value) {
    delete nodeData.data['attr_flowable:candidateRoles']

    nodeData.data['attr_flowable:candidateGroups'] = ''
    nodeData.data.extensionElements = {
      ['modeler:activiti-idm-candidate-group']: {
        ['attr_xmlns:modeler']: 'http://flowable.org/modeler',
        ['__cdata']: true
      },
      ['modeler:initiator-can-complete']: {
        ['attr_xmlns:modeler']: 'http://flowable.org/modeler',
        ['__cdata']: false
      },
      ['modeler:group-info-name-Adhoc_Group']: {
        ['attr_xmlns:modeler']: 'http://flowable.org/modeler',
        ['__cdata']: ''
      }
    }
  } else {
    delete nodeData.data['attr_flowable:candidateGroups']

    nodeData.data.extensionElements = {
      ['flowable:taskListener']: {
        ['attr_delegateExpression']: '${customTaskAssignmentListener}',
        ['attr_event']: 'create'
      }
    }
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
}

// TODO: 開啓下方的role設定，也需要將該代碼打開
// watch(() => node, () => {
//   if (node) {
//     switchRef.value = ['attr_flowable:candidateGroups'] in node.data.data
//   }
// }, {
//   immediate: true,
//   deep: true
// })
</script>

<template>
  <div class="fromContainer">
    <BpmnSidebarEditLabel :node="node" />
    <!-- TODO: 後端暫時未支援role的設定   -->
    <!--        <el-switch :disabled="editorProvider.readonly.value" v-model="switchRef" size="small" active-text="Group"
               inactive-text="Roles" @change="handleSwitch" />-->
    <!--    <BpmnSidebarEditStartCandidate v-if="switchRef" :node="node" />-->
    <!--    <BpmnSidebarEditCandidateRoles v-else :node="node" />-->
    <BpmnSidebarEditStartCandidate :node="node" />
    <BpmnSidebarStarterAdditionLogic :node="node" />
    <BpmnSidebarEditForm :node="node" />
    <BpmnSidebarPreviewDocument :node="node" />
    <BpmnSidebarBooleanButton :node="node" />
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  overflow: auto;
}
</style>