<script lang="ts" setup>
import { updateExtentionProperties, getExtentionProperties } from '../../../utils/cmmnConfig'
import { newAdminApi } from 'api'
const props = defineProps(['graph', 'node'])
const {node} = toRefs(props)
const state = reactive<any>({
    inData: [],
    outData: [],
    activeName: 'workflow'
})
const inputHeader = [
    { name: 'source', label: 'Case Infomation' },
    { name: 'target', label: 'Workflow Variables' }
]
const outputHeader = [
    { name: 'source', label: 'Workflow Variables' },
    { name: 'target', label: 'Case Information' }
]
function handleSave(type: 'flowable:in'|'flowable:out', data) {
    const nodeData = node.value.data
    updateExtentionProperties(nodeData.data, type, data)
}

const workflowVariable = ref<any[] | null>();
const inForm = ref();
const outForm = ref();
async function init() {
    const nodeData = node.value.getData()
    try {
        inForm.value = nodeData.data.extensionElements['flowable:in'] || []
        outForm.value = nodeData.data.extensionElements['flowable:out'] || []
        console.log("init", inForm.value, outForm.value)
        if(nodeData.data.processRefExpression.__cdata) {
          workflowVariable.value = await newAdminApi.postDocpalWorkflowProperties({processKey:nodeData.data.processRefExpression.__cdata}).then(r => r.data)
        }else{
            workflowVariable.value = null
        }
        // nomalize processTask
        if(!nodeData.data.extensionElements['flowable:planItemLifecycleListener']) {
            node.value.setData({
                ...nodeData,
                data:{
                    ...nodeData.data,
                    extensionElements:{
                        ...nodeData.data.extensionElements,
                        'flowable:planItemLifecycleListener':{
                            attr_sourceState:'active',
                            attr_targetState: 'completed',
                            attr_delegateExpression: '${cmmnProcessTaskLifecycleListener}'
                        }
                    }
                }
            },{
                overwrite:true, deep:true
            })
        }

        // state.outData = getExtentionProperties(nodeData.data, 'flowable:out')
    } catch (error) {
        workflowVariable.value = null
    }
}

function inOutFormChange(newForm: any, type: 'in' | 'out') {
    const formKey = type === 'in' ? 'flowable:in' : 'flowable:out'
    const nodeData = node.value.getData()
    const newData = {
        ...nodeData,
        version: nodeData.version + 1 || 1,
        data:{
            ...nodeData.data,
            extensionElements:{
                ...nodeData.data.extensionElements,
                [formKey]: newForm
            }
        }
    }
    node.value.setData(newData, {
        overwrite: true
    })
    console.log("inOutFormChange", newForm, nodeData)
}
function handleClick() {}

watch(node, async()=> {
    if(node.value) {
        await init()
    }
},{
    immediate: true,
    deep: true
})
</script>

<template>
    <div class="cmmnSidebarItemContainer">
        <CmmnSidePanelUiHeader title="Process Task" />
        <CmmnSidePanelUiLabel :node="node"/>
        <CmmnSidePanelUiItemControl :node="node"/>
        <el-tabs v-model="state.activeName" @tab-click="handleClick">
            <el-tab-pane :label="$t('workflow_workflowName')" name="workflow">
                <CmmnSidePanelUiWorkflow :node="node" @change="init"/>
            </el-tab-pane>
            <el-tab-pane v-if="workflowVariable" :label="$t('cmmn.input')" name="input">
                <CmmnSidePanelUiWorkflowInOut type="in" :workflowInfos="workflowVariable" :form="inForm" @change="(newForm) => inOutFormChange(newForm, 'in')" />
                <!-- <CmmnSidePanelDraggable :list="state.inData"
                    :node="node" :graph="graph"
                    :dragHeader="inputHeader"
                    formJsonUrl="flowableIn"
                    @change="handleSave('flowable:in', state.inData)">
                </CmmnSidePanelDraggable> -->
            </el-tab-pane>
            <el-tab-pane v-if="workflowVariable" :label="$t('cmmn.output')" name="output">
                <CmmnSidePanelUiWorkflowInOut type="out" :workflowInfos="workflowVariable" :form="outForm" @change="(newForm) => inOutFormChange(newForm, 'out')"  />

                <!-- <CmmnSidePanelDraggable
                    :node="node" :graph="graph"
                    :list="state.outData"
                    :dragHeader="outputHeader"
                    formJsonUrl="flowableOut"
                    @change="handleSave('flowable:out', state.outData)">
                </CmmnSidePanelDraggable> -->
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<style scoped lang="scss">

</style>