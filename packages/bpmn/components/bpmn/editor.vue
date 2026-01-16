<script lang="ts" setup>
import type { Node, Edge, Cell } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { Selection } from '@antv/x6-plugin-selection'
import { Dnd } from '@antv/x6-plugin-dnd'
import { History } from '@antv/x6-plugin-history'
import { graphToBpmnJson } from '~/utils/bpmnConverter'
import { adminApi, clientApi } from 'api'
import { bpmnElement } from '~/utils/bpmnElement'

import { ElMessage } from 'element-plus'
import { EDITOR_PROVIDER, conditionOptions, MenuRouterKey } from '#imports'

/**
 *  options: bpmn viewer options
 *  workflowData: workflow data ( versionNamber, versionId ...etc)
 */
const routerProvider = inject(MenuRouterKey)
const xmlEl = ref()
const props = defineProps<{
  options?: any
  workflowData: any
  currentVersion: string
  currentVersionId: string
  readonly: boolean
  processKey: string
  id: string
}>()

const { options = {}, workflowData, currentVersion, readonly } = toRefs(props)
const workflowDetail = inject<{saveDraft:()=>void}>('workflowDetail')
const BpmnRule = useBpmnRule({
  versionDraftId: props.currentVersionId,
  version: props.currentVersion.replace('V', ''),
  taskName: 'global',
  draftId: props.id,
  workflowDetail
})
const { getTaskFieldRules } = BpmnRule
const graphOptions = ref({})
const bpmn = ref('')
function init(bpmnXml: string, x6Json?: any) {
  console.log('init editor')
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
  bpmn.value = bpmnXml
  console.log('init bpmn',props)
  nextTick(() => {
    viewerRef.value.init(bpmnXml, x6Json)
  })
}
const viewerRef = ref()
const ready = ref(false)
const workflowFieldList: any = ref({
  labelKey: 'name',
  nameKey: 'id',
  data: []
})

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
  })
}

function getData() {
  const bpmnJson = viewerRef.value.bpmnJson
  return graphToBpmnJson(viewerRef.value.graph, bpmnJson)
}

function openInfo() {
  sidebarRef.value.openInfo()
}

function openPermission() {
  sidebarRef.value.openPermission()
}

// #region form
const FormDesignRef = ref()
const formDialogVisible = ref(false)
const selectedStep = ref()

const dropActionsItems = computed(() => {
  return Object.values(bpmnElement).reduce((acc: any, cur: any) => {
    if (cur.toolbar.length > 0) {
      acc.push(...cur.toolbar)
    }
    return acc
  }, [])
})

function itemDrop(item: any, ev: any) {
  if (readonly.value) return
  const id = 'new_' + new Date().getTime()
  const newData = item.dropData(id)
  const newNode = graph.value.createNode(newData)
  dnd.value.options.getDragNode = (node: Node) => node
  dnd.value.options.getDropNode = (node: Node) => node.clone({ keepId: true })
  dnd.value.start(newNode, ev)
}

async function formSubmit() {
  const json = FormDesignRef.value.getFormJson()
  await clientApi.api.postDmsFormPropertiesSave({
    processKey: props.processKey,
    userTaskId: selectedStep.value.id,
    jsonValue: JSON.stringify(json),
    versionId: props.currentVersionId
  })
  formDialogVisible.value = false
}

async function getFormByNode(node: Node) {
  const response = await clientApi.api.getDmsFormPropertiesQuery({
    processKey: props.processKey,
    userTaskId: node.data.id,
    versionId: props.currentVersionId
  })
  if (!response || !response.data || response.data.length === 0) {
    return {}
  }
  const json = JSON.parse(response.data[0].jsonValue || '{}')
  console.log('getFormByNode', json)
  return json
}

async function saveFormByNode(node: Node, json: any) {
  const id = node.data.type === 'endEvent' ? 'end' : node.id
  return await clientApi.api.postDmsFormPropertiesSave({
    processKey: props.processKey,
    userTaskId: id,
    jsonValue: JSON.stringify(json),
    versionId: props.currentVersionId
  })
}

const formRenderVisible = ref(false)
const fromRenderRef = ref()
async function previewForm(node: Node) {
  const id = node.data.type === 'endEvent' ? 'end' : node.id
  const response = await clientApi.api.getDmsFormPropertiesQuery({
    processKey: props.processKey,
    userTaskId: id,
    versionId: props.currentVersionId
  })
  if (!response || !response.data) {
    throw createError('Server Error')
  }
  if (response.data.length == 0 || !response.data[0].jsonValue || response.data[0].jsonValue === '{}') {
    ElMessage.warning('Empty Form')
    return
  }
  selectedStep.value = node.getData()
  formRenderVisible.value = true
  nextTick(() => {
    if (!response || !response.data) return
    if (response?.data.length > 0) {
      const json = JSON.parse(response.data[0].jsonValue || '{}')
      fromRenderRef.value.setForm(json)
    } else {
      fromRenderRef.value.setForm({})
    }
  })
}

const getGraphValue = computed(() => {
  if (viewerRef.value) {
    return viewerRef.value.graph
  }
  return null
})

async function openForm(node: Node) {
  try {
    const formProperty = node.data?.data?.extensionElements?.['flowable:formProperty']
    if(!formProperty && node.id !== 'end') {
      ElMessage.warning('Empty Form Property')
      return
    }
    const id = node.data ? node.data.id : node.id === 'end' ? 'complete' : node.id
    const response = await clientApi.api.getDmsFormPropertiesQuery({
      processKey: props.processKey,
      userTaskId: id,
      versionId: props.currentVersionId
    })
    if (!response || !response.data) {
      throw createError('Server Error')
    }
    selectedStep.value = node.getData()
    workflowFieldList.value.data = getTaskFieldRules(formProperty)
    formDialogVisible.value = true
    nextTick(() => {
      if (!response || !response.data) return
      if (response?.data.length > 0) {
        FormDesignRef.value.setFormJson({})
        const json = JSON.parse(response.data[0].jsonValue || '{}')
        FormDesignRef.value.setFormJson(json)
      } else {
        FormDesignRef.value.setFormJson({})
      }
    })
  } catch (error) {
    
  }
}

const copyKey = useState('copy-key', () => "")
const copyObj = useState('copy-obj')
async function copyForm(node: Node, obj: any) {
  copyKey.value = node.data.id
  copyObj.value = obj
  routerProvider?.message.success(`${node.data.name || node.data.id} form has copied`)
}
async function pasteForm(node: Node) {
  const { form, fields } = copyObj.value
  await saveFormByNode(node, form)
  if (node.data.type !== 'endEvent') {
    graph.value?.startBatch('update-from-data')

    const newData = {
      ...node.data,
      version: (node.data.version || 0) + 1,
      data: {
        ...JSON.parse(JSON.stringify(node.data.data)),
        extensionElements: {
          ...node.data.data.extensionElements,
          'flowable:formProperty': [...fields]
        }
      }
    }
    node.setData(newData, { overwrite: true, deep: true, silent: false })
    graph.value?.stopBatch('update-from-data')
  }

  // notify user
  routerProvider?.message?.success(`${node.data.name || node.data.id} has paste the copied content`)
  // reset copyObj
}

/// #endregion
type ExportWorkflowResult = {
  json: any,
  x6Json: any,
  bpmnGlobalRules: any,
  allForms: any[]
}
async function exportWorkflow() {
  const { xml, json, x6Json } = getData()
  const bpmnGlobalRules = BpmnRule.bpmnGlobalRules.value
  const allForms = await getAllFormFromXML(xml, props.processKey, props.currentVersionId)
  const result = {
    json: json,
    x6Json: x6Json,
    bpmnGlobalRules: bpmnGlobalRules,
    allForms
  }
  console.log('exportWorkflow', result)
  return result
}

async function importWorkflow(importData:ExportWorkflowResult) {
  const { json, x6Json, bpmnGlobalRules, allForms } = importData
  const newBpmnJson = json
  newBpmnJson.definitions.process.attr_id = props.processKey
  newBpmnJson.definitions.process.attr_name = props.workflowData.name
  // convert to newBpmnJson to bpmn xml
  const newBpmnXml = jsonToBpmn(newBpmnJson)
  init(newBpmnXml, x6Json)
  // save bpmnGlobalRules
  await BpmnRule.setBpmnRules(bpmnGlobalRules, null)
  // save form to 
  const version = props.currentVersionId
  const processKey = props.processKey
  allForms.forEach(async (form) => {
    const res = await clientApi.api.postDmsFormPropertiesSave({
      processKey: processKey,
      userTaskId: form.formId,
      jsonValue: form.json,
      versionId: version,
    })
  })
  await workflowDetail?.saveDraft()
}

const conditionSetting = ref<Record<string, object>[]>([])

async function getConditionSetting() {
  conditionSetting.value = conditionOptions as any
}
const sidebarRef = ref()
function openSidebar(component: string, node: Node | Edge | Cell) {
  sidebarRef.value.openSidebar(component, node)
}

function openXmlEditor() {
  xmlEl.value.openXmlEditor()
}

// Handle XML editor save
function handleXmlSave(xml: string) {
  xmlEl.value.closeXmlEditor()
  // Update the bpmn ref with the new XML
  bpmn.value = xml
  // Reinitialize the graph with the new XML
  ready.value = false
  nextTick(() => {
    viewerRef.value.init(xml)
    graphReady()
  })
}

// Handle XML editor refresh
function handleXmlRefresh() {
  console.log('XML editor refreshed')
  // Refresh the XML editor with current graph data
  if (xmlEl.value) {
    xmlEl.value.refreshXml()
  }
}

onMounted(async () => {
  await getConditionSetting()
})

provide(EDITOR_PROVIDER, {
  openSidebar,
  openForm,
  previewForm,
  openPermission,
  openInfo,
  saveFormByNode,
  getFormByNode,
  pasteForm,
  copyForm,
  copyObj,
  copyKey,
  conditionSetting,
  readonly,
  currentVersionId: props.currentVersionId,
  processKey: props.processKey,
  currentVersion: props.currentVersion,
  draftId: props.id,
  BpmnRule,
})

defineExpose({
  init,
  getData,
  getGraphValue,
  exportWorkflow,
  importWorkflow
})
</script>

<template>
  <div class="bpmnEditorContainer">
    <BpmnViewer ref="viewerRef" :options="graphOptions" @graph-ready="graphReady">
      <div v-if="ready" class="toolbar">
        <div class="group">
          <BpmnHistory />
          <BpmnInfo @click="openInfo" />
          <BpmnPermission @click="openPermission" />
        </div>
        <div v-if="!readonly" class="group">
          <div v-for="(item, index) in dropActionsItems" :key="index" class="icon handlers" @mousedown.native="(ev) => itemDrop(item, ev)">
            <Icon :name="item.icon" />
            <div class="label">{{ item.label }}</div>
          </div>
        </div>
      </div>
      <BpmnSidebar ref="sidebarRef" />
      <BpmnEdge v-if="ready" ref="edgeEl" />
      <BpmnNode v-if="ready" ref="nodeEl" @openForm="openForm" />
      <BpmnXmlEditor 
        v-if="ready" 
        ref="xmlEl"
        :bpmnXml="bpmn"
        :readonly="readonly"
        @save="handleXmlSave"
        @refresh="handleXmlRefresh"
      />
    </BpmnViewer>
    <ElDialog v-model="formDialogVisible" fullscreen class="bpmn-vform--dialog" width="100%" top="0" append-to-body destroy-on-close>
      <FormDesigner ref="FormDesignRef" :fieldListApi="workflowFieldList">
        <template #submit>
          <ElButton type="primary" @click="formSubmit">{{ $t('submit') }}</ElButton>
        </template>
      </FormDesigner>
    </ElDialog>
    <ElDialog v-model="formRenderVisible" class="big" distory-on-close draggable>
      <WorkflowDetailFormRender ref="fromRenderRef" />
    </ElDialog>
    <div class="actions">
      <slot name="actions" />
      <ElButton @click="openXmlEditor" :disabled="!ready">Open XML Editor</ElButton>
    </div>
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
.actions {
  padding: var(--app-space-xs);
}
.toolbar {
  position: absolute;
  left: var(--app-space-m);
  top: var(--app-space-m);
  z-index: 2;
  display: flex;
  flex-flow: column nowrap;
  justify-content: stretch;
  align-items: flex-start;
  gap: var(--app-space-xs);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  .group {
    box-shadow: var(--app-shadow-s);
    color: var(--app-grey-400);
    line-height: 0;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    border-radius: var(--app-border-radius-m);
    border: 1px solid var(--app-grey-800);
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-l);
    padding: var(--app-space-xs);
    background: var(--app-grey-950);
  }
  &:hover,
  &:focus-within {
    :deep(.label) {
      display: block !important;
    }
    :deep(.icon) {
      width: 100%;
    }
  }

  :deep(.icon) {
    border-radius: 0;
    border: 0;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);
    &.handlers {
      cursor: grab;
    }
    &.disabled {
      color: var(--app-grey-700);
      cursor: not-allowed !important;
    }
    cursor: pointer;
    &:hover {
      color: var(--app-main-color);
    }
    .label {
      font-size: var(--app-font-size-s);
      display: none;
    }
  }
}
</style>
<style lang="scss">
.bpmn-vform--dialog {
  overflow: hidden !important;
  display: grid;
  grid-template-rows: min-content 1fr;
  .el-dialog__body {
    overflow: hidden;
  }
  .center-layout-container {
    .el-main {
      overflow: hidden;
      .el-scrollbar {
        height: 100% !important;
      }
    }
  }
  .el-aside {
    .el-tabs {
      height: 100%;
      overflow: hidden;
      .el-tabs__content {
        overflow: auto;
      }
    }
  }
}
</style>
