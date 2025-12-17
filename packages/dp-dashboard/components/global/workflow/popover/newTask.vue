<template>
  <el-dropdown id="Workflow__NewWorkflow" popper-class="popover-auto" trigger="click"
               @command="workflowClickHandler">
    <el-button type="primary" :loading="state.loading">
      {{ $t('workflow_newWorkflow') }}
      <el-icon class="el-icon--right">
        <arrow-down />
      </el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="wf in state.availableWorkflow" :key="wf.id" :command="wf">
          {{ wf.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <el-dialog v-model="state.formDialogVisible" :title="state.selectedWorkflow.name"
             destroy-on-close append-to-body width="60%"
             :close-on-click-modal="false"
             :fullscreen="isFullScreen"
             @close="isFullScreen = false"
             class="scroll-dialog big"
  >
    <template #header>
      <div class="dialog-title">
        <h3>{{ state.selectedWorkflow.name }}</h3>
        <div class="float-right">
          <Icon name="mdi:fullscreen" class="cursor-pointer" @click="isFullScreen = !isFullScreen" />
        </div>
      </div>
    </template>
    <ElTabs v-if="state.formDialogVisible" v-model="activeName" v-loading="state.loading"
            @tab-change="tabChangeHandler">
      <ElTabPane v-loading="state.loading" :label="$t('workflow_form')" name="Form">
        <WorkflowDetailFormRender ref="vFormRef" />
      </ElTabPane>
      <ElTabPane :label="$t('workflow_graph')" name="Graph">
        <BpmnViewer v-if="activeName === 'Graph'" ref="graphEl" class="graphContent" step="start"
                    @graphReady="graphReady" />
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <el-button v-if="!pageButtonSetting || pageButtonSetting.showSumBitButton"
                 id="Workflow__NewWorkflow__StartWorkflow" type="primary" :disabled="state.loading" @click="checkAndSubmit">
        <template v-if="pageButtonSetting && pageButtonSetting.submitButtonLabel">
          {{ pageButtonSetting.submitButtonLabel }}
        </template>
        <template v-else>
          {{ $t('common_submit') }}
        </template>
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
// @ts-ignore
import { clientApi } from 'api'

const { formStartHandle } = useWorkflow()
const isFullScreen = ref(false)
// @ts-ignore
const graphEl = ref()
const emits = defineEmits(['created'])
// @ts-ignore
const activeName = ref('Form')
// @ts-ignore
const state = reactive({
  availableWorkflow: [],
  formDialogVisible: false,
  selectedWorkflow: {},
  bpmnXml: null,
  loading: false
})

const routerProvider = inject(MenuRouterKey)

function tabChangeHandler() {
  if (activeName.value === 'Graph') {
    // @ts-ignore
    nextTick(async () => {
      console.log(state.selectedWorkflow)
      graphEl.value.init(state.bpmnXml)
    })
  }
}

async function getAvailableWorkflow() {
  state.availableWorkflow = await clientApi.api.postWorkflowProcessList({}).then(res => res.data)
}

async function workflowClickHandler(item: any) {
  let step = 'Start'
  state.loading = true

  //TODO : get xml and check if need to open new page
  const xml = await clientApi.api.getWorkflowVersionVersionidBpmnxml(item.versionId)
  const { flatObj } = bpmnStringToJson(xml)
  const startEvent = flatObj.Start
  state.formDialogVisible = true
  // check start event additional setting
  if (startEvent?.extensionElements && startEvent?.extensionElements['docpal:additionaSetting']) {
    const openInNewPage = startEvent.extensionElements['docpal:additionaSetting'].attr_openInNewPage
    if (openInNewPage) {
      state.formDialogVisible = false
      state.loading = false
      const link = newWorkflowStartPage(item.name, step, item.key, item.versionId)
      routerProvider?.navigateTo(link)
      return
    }
  }
  // get bpmn
  if (formStartHandle.value[item.key]) {
    const result = formStartHandle.value[item.key].cb(item.key)
    if (result && result.step) {
      step = result.step
    }
    if (!formStartHandle.value[item.key].isContinue) {
      return
    }
  }


  // @ts-ignore
  state.selectedWorkflow = deepCopy(item)
  initForm(item.key, item.versionId)
  state.loading = false
  // createWorkflowForm.value = await workflowStore.getFromProperties(item.key)

  // opened.value = true

  // // vform
  // const formData = await formInit(createWorkflowForm.value)
  // const formJson = await handleTaskFormJsonGet(selectedWorkflow.value)
  // VformRenderRef.value.setFormDataAndJson(formJson, formData, createWorkflowForm.value)
}


// #region module: vform
// @ts-ignore
const vFormRef = ref()

async function checkAndSubmit() {
  state.loading = true
  const data = await vFormRef.value.getFormData()
  if (data) {
    
    const form = {
      processKey: state.selectedWorkflow.key,
      businessKey: data.businessKey || '',
      properties: Object.entries(data).reduce((newObj, [key, val]) => {
        if (val || val === false || val == '0') newObj[key] = val
        return newObj
      }, {})
    }
    
    try {
      await clientApi.api.postWorkflowProcessStart(form).then(res => res.data)
      state.formDialogVisible = false
      ElMessage.success('Workflow created')
      emits('created')
    } catch (error) {

    }
  }
  state.loading = false
}

type AdditionalButton = {
  props: any
  component: string
}
const additionalButton = ref<AdditionalButton[]>([])
const pageButtonSetting = ref<any>(null)

async function handleAdditionalSetting(xml: any, taskDetail: any, formData: any) {
  const {
    buttons,
    components,
    signatureSetting,
    buttonSetting
  } = await getBpmnAdditionalElement(xml, 'Start', taskDetail, formData)
  additionalButton.value = buttons
  if (buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

async function initForm(processKey: string, versionId: string) {
  const props = await clientApi.api.postWorkflowProperties({ processKey }).then(res => res.data)
  const formData = formDataGet(props)
  const formJson = await formJsonGet('start', processKey, versionId)
  setTimeout(() => {
    vFormRef.value.setForm(formJson, formData, props)
  })
  const blob: any = await clientApi.api.postWorkflowProcessModel({ processKey }, {
    format: 'blob'
  })
  const text = await blob.text()
  state.bpmnXml = text
  await handleAdditionalSetting(text, processKey, {}, {})
}

function graphReady() {
  graphEl.value.autoLayout(state.bpmnXml)
}

function formDataGet(propList = []) {
  return propList.reduce((prev, item) => {
    prev[item.id] = item.value
    return prev
  }, {})
}

async function formJsonGet(userTaskId: string, processKey: string, versionId: string) {
  const response: any = await clientApi.api.getRelationQuery({
    userTaskId,
    processKey,
    versionId
  }).then(res => res.data)
  if (!response[0] ||
    response[0] && !response[0].jsonValue) return {}
  return JSON.parse(response[0].jsonValue)
}

// #endregion
// @ts-ignore
onMounted(() => {
  getAvailableWorkflow()
})
defineExpose({ workflowClickHandler })
</script>
<style lang="scss" scoped>
.dialog-title {
  display: flex;
  justify-content: space-between;
}

.float-right {
  padding-right: 10px;
}

.graphContent {
  height: 500px;
}

</style>
<style lang="scss">
.popover-auto {
  max-height: 70vh;
  overflow: auto;
}
</style>
