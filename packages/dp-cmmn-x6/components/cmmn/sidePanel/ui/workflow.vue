<script lang="ts" setup>
import {Graph, Node} from "@antv/x6";
import {newAdminApi, newClientApi} from 'api'

const props = withDefaults(defineProps<{
  graph: Graph,
  node: Node
}>(), {})
const {node} = toRefs(props)
const emits = defineEmits(['change'])
const form = ref<any>({
  workflow: ''
})
const state = reactive<any>({
  options: [],
  workflowLoading: false
})
const bpmnFile = ref()

function init(nodeData: any) {
  try {
    form.value.workflow = nodeData.data.processRefExpression.__cdata
    console.log("init", form.value.workflow)
    if (form.value.workflow) {

      getBpmn(form.value.workflow)
    }
  } catch (error) {
    console.log("error", error)
  }
}

const bpmnViewerRef = ref();

function handleChange(value: string) {
  try {
    const nodeData = node.value.getData()
    const newData = {
      ...nodeData,
      version: nodeData.version + 1 || 1,
      data: {
        ...nodeData.data,
        extensionElements: {
          ...nodeData.data?.extensionElements,
          'flowable:in': [],
          'flowable:out': []
        },
        processRefExpression: {
          ...nodeData.data?.processRefExpression,
          __cdata: value
        }
      }
    }
    if (value) {
      getBpmn(value)
    } else {
      bpmnFile.value = null
    }
    node.value.setData(newData, {
      overwrite: true
    })
    emits('change')

  } catch (error) {

  }
}

const getBpmn = async (processKey: string) => {
  state.workflowLoading = true
  try {
    const blob = await newAdminApi.postDocpalWorkflowProcessModel({
      processKey
    }, {
      format: 'blob',
      timeout: 0
    })
    const text = await blob.text()
    bpmnFile.value = text
    nextTick(() => {
      bpmnViewerRef.value.init(text)
    })
  } catch (error) {
    console.log("error", error)
  }
  state.workflowLoading = false
}
onMounted(async () => {
  state.options = await newClientApi.postDsbWorkflowProcessList({requestDTO: {}}).then(r => r.data)
})
watch(node, () => {
  console.log("watch node", node.value)
  if (node.value) {
    init(node.value.data)
  }
}, {
  immediate: true
})
</script>

<template>
  <el-form ref="FormRef"
           label-position="top"
           :model="form"
           @submit.prevent>
    <el-formItem :label="$t('easyForm.WorkflowTemplateKey')" prop="workflow"
                 :rules="[{ required: true, message: $t('easyForm.WorkflowTemplateKey') + $t('render.hint.fieldRequired')}]">
      <el-select v-model="form.workflow" filterable clearable allow-create @change="handleChange">
        <el-option v-for="item in state.options" :key="item.key"
                   :label="item.name" :value="item.key">
        </el-option>
      </el-select>
    </el-formItem>
  </el-form>
  <div v-if="bpmnFile" class="bpmn-container">
    <BpmnViewer ref="bpmnViewerRef">
    </BpmnViewer>
  </div>
</template>

<style lang="scss" scoped>
.bpmn-container {
  height: 400px;
  width: 100%;

  .workflowEditorViewerContainer {
    border: 1px solid #ddd;
  }
}
</style>
