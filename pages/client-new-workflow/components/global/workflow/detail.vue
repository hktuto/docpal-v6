<script lang="ts" setup>
import { newClientApi, clientApi } from 'api'
import { routeWorkflowPage, workflowResponseHelper } from '#imports'
import { generateData, replaceVariables } from 'docpal-document-editor/src/utils'
import { CellType, conversionFormDataByVariables, getButtonAdditionalElement } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { detail, db_id, workflowType, backItem } = defineProps<{
  detail: any
  db_id: string
  workflowType: string
  backItem?: any
}>()
// @ts-ignore
const userId: string = useUserId().value
const { t } = useI18n()
const state = reactive<any>({
  activeTab: 'form',
  loading: true,
  error: null,
  title: ''
})
const fromRenderRef = ref()
const taskDetail = ref({})
const variables = ref({})
const variablesData = ref({})
const contentData = ref({})
const nodeType = ref<'UserTask' | 'SignatureTask'>('UserTask')
const isAssigneeUser = ref<boolean>(false)

async function getDetail() {
  if (!db_id || db_id === '') {
    state.error = 'Id not exist'
    return
  }
  try {
    if (workflowType === 'completeTask') {
      await handleCompleteTask()
      return
    }

    state.loading = true
    state.error = null
    const data: any = await clientApi.instance.get(`/oniflow/api/v1/processes/instance-task/${db_id}`).then((r: any) => workflowResponseHelper(r))
    if (!data) {
      state.error = 'Get Task Detail Failed'
      return
    }

    if (data.status.type !== 'assigned') {
      state.error = 'Is not assigned'
      return
    }
    taskDetail.value = data
    state.title = data.config?.human_task?.form_title || data.name
    variables.value = data.config?.human_task?.form_fields || []

    const instanceData = await clientApi.instance.get(`/oniflow/api/v1/processes/instance/${data.process_id}`).then((r: any) => workflowResponseHelper(r))
    variablesData.value = instanceData.variables || {}
    contentData.value = await clientApi.instance
      .get(`/oniflow/api/v1/workflow/definitions/instance/${instanceData.definition_id}/content`)
      .then((r: any) => workflowResponseHelper(r))

    if (data.config?.human_task?.assignee === userId) {
      isAssigneeUser.value = true
      await handleAdditionalSetting(contentData.value.nodes, data.metadata, variables.value)
    }
    await initForm(data)
  } catch (error) {
    console.log(error)
    state.error = error
  }
  state.loading = true
}

async function handleCompleteTask() {
  showForm.value = false
  state.activeTab = 'info'
  taskDetail.value = detail
  contentData.value = await clientApi.instance
    .get(`/oniflow/api/v1/workflow/definitions/instance/${detail.definition_id}/content`)
    .then((r: any) => workflowResponseHelper(r))
}

async function initForm(node: any) {
  const formKey = node.config.human_task.form_key
  if (!formKey) {
    routerProvider?.message.error('The form does not exist!')
    return
  }

  // Get Form Json
  const formJsonData = await newClientApi.getDmsFormPropertiesId(formKey).then((r: any) => r.data)
  if (!formJsonData || !formJsonData.jsonValue) {
    routerProvider?.message.error('The form does not exist!')
    return
  }

  // Get Form Data
  fromRenderRef.value.setForm(formJsonData.jsonValue, variablesData.value)
  handleDisabledForm()
}

const showForm = ref(true)
const formDataValue = ref<any>(null)

/// #region full screen logic
const workflowFormContainerRef = ref<any>(null)
const isFullScreenForm = ref(false)

function fullscreenEventListen() {
  isFullScreenForm.value = !!document.fullscreenElement
}

watch(
  isFullScreenForm,
  (newVal) => {
    if (newVal) {
      document.addEventListener('fullscreenchange', fullscreenEventListen)
    } else {
      document.removeEventListener('fullscreenchange', fullscreenEventListen)
    }
  },
  {
    immediate: true
  }
)

function toggleFullScreenForm() {
  isFullScreenForm.value = !isFullScreenForm.value
  if (isFullScreenForm.value) {
    const el = workflowFormContainerRef.value
    if (el) {
      el.requestFullscreen()
    }
  } else {
    document.exitFullscreen()
  }
}

function toggleShowForm() {
  showForm.value = !showForm.value
}

function handleDisabledForm() {
  if (!isAssigneeUser.value || workflowType === 'completeTask') {
    fromRenderRef.value.disableForm()
  }
}

const signSubmitStage = ref<'beforeSubmit' | 'afterSubmit'>('beforeSubmit')
const signatureSettingDialogRef = ref<any>(null)

function openSignatureSettingDialog() {
  signatureSettingDialogRef.value.open()
}

async function handleCancel() {
  let data = await fromRenderRef.value.getFormData(false, false)
  data[signatureDetail.value.workflowKeyToStoreSignature] = null
  const allFormData = {
    ...formDataValue.value,
    ...data
  }
  const templateVariables = convertWorkflowVariableToTemplateVariable(allFormData, signatureDetail.value.workflowToTemplateMapping)

  // check if current step need to sign
  if (signatureDetail.value.signatureVariableSetting) {
    templateVariables[signatureDetail.value.signatureVariableSetting.id] =
      signatureDetail.value.templateVariables[signatureDetail.value.signatureVariableSetting.id]
  }
  const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(signatureDetail.value.templateDetail)))
  const content = signatureDetail.value.templateDetail.json.content.content
  signatureDetail.value.templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
  temSignatureData.value = null
  signSubmitStage.value = 'beforeSubmit'
}

async function handleSubmit() {
  // if nodeType is signature, and signSubmitStage is beforeSubmit, do not submit form, open signature setting dialog
  if (nodeType.value === CellType.signatureTask && signSubmitStage.value === 'beforeSubmit' && signatureDetail.value.signatureVariableSetting) {
    openSignatureSettingDialog()
    return
  }

  state.loading = true
  try {
    if (!isAssigneeUser.value) {
      await clientApi.instance
        .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.db_id}/claim`, {
          user_id: userId
        })
        .then((res: any) => res.data)
    }

    if (nodeType.value === CellType.userTask || CellType.signatureTask) {
      await handleSubmitUserTask()
    } else {
      await handleSubmitServiceTask()
    }

    routerProvider?.message.success(`${t('msg_successfulOperation')}`)
    const fallbackRoute = routeWorkflowPage({
      workflowType: workflowType
    })
    routerProvider?.replace(fallbackRoute)
  } catch (error) {
    console.log('error', error)
    routerProvider?.message.error(error.message)
  } finally {
    state.loading = false
  }
}

async function handleSubmitUserTask() {
  // get form formData
  let formData = await fromRenderRef.value.getFormData(true, false)
  if (signSubmitStage.value === 'afterSubmit') {
    formData[signatureDetail.value.workflowKeyToStoreSignature] = temSignatureData.value
  }

  if (!formData) throw new Error(`${t('incompleteData')}`)

  // check additional button
  // if additional button has expose "beforeSubmit" method, call it
  const additionButtonActions: any = []
  additionalButtonRef.value.forEach((item) => {
    if (item && item.beforeSubmit) {
      additionButtonActions.push(item.beforeSubmit())
    }
  })

  const buttonResults = await Promise.all(additionButtonActions)
  // after check all actions, if any additional formData need to set to from formData, set it
  buttonResults.forEach((item: any) => {
    if (item && typeof item === 'object') {
      formData = { ...formData, ...item }
    }
  })

  // conversion FormData
  const cFormData = conversionFormDataByVariables(formData, variables.value)

  const data = clientApi.instance
    .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/complete`, {
      process_id: taskDetail.value.process_id,
      user_id: userId,
      variables: cFormData
    })
    .then((r: any) => workflowResponseHelper(r))
  console.log('--- handleSubmitUserTask: ', data)
}

async function handleSubmitServiceTask() {
  const formData = await fromRenderRef.value.getFormData(true, false)
  const cFormData = conversionFormDataByVariables(formData, variables.value)
  const data = clientApi.instance
    .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/execute`, {
      process_id: taskDetail.value.process_id,
      variables: cFormData
    })
    .then((r: any) => workflowResponseHelper(r))
  console.log('--handleSubmitServiceTask: ', data)
}

type AdditionalButton = {
  props: any
  component: string
}
const additionalButton = ref<AdditionalButton[]>([])
const additionalButtonRef = ref<any[]>([])
const signatureDetail = ref<any>()
const pageButtonSetting = ref<any>()
const temSignatureData = ref<any>(null)

// Render template content
async function handleApplySignature(newSignature: any) {
  // get form data
  let data = await fromRenderRef.value.getFormData(true, false)

  data[signatureDetail.value.workflowKeyToStoreSignature] = newSignature
  const allFormData = {
    ...formDataValue.value,
    ...data
  }
  const templateVariables = convertWorkflowVariableToTemplateVariable(allFormData, signatureDetail.value.workflowToTemplateMapping)
  const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(signatureDetail.value.templateDetail)))
  const content = signatureDetail.value.templateDetail.json.content.content
  signatureDetail.value.templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
  temSignatureData.value = newSignature
  signSubmitStage.value = 'afterSubmit'
}

async function handleAdditionalSetting(nodes: any[], metadata: any, formVariables: any) {
  const setting: any = await getButtonAdditionalElement(nodes, metadata, formVariables)

  additionalButton.value = setting.buttons
  pageButtonSetting.value = setting.buttonSetting
  nodeType.value = metadata.type
  if (nodeType.value === CellType.signatureTask) {
    signatureDetail.value = setting.signatureSetting
    signSubmitStage.value = 'beforeSubmit'
  } else {
    signatureDetail.value = null
  }
}

async function handleFormChange() {
  if (nodeType.value === CellType.signatureTask) {
    // get new form data and update signature preview
    let data = await fromRenderRef.value.getFormData(true, false)
    const allFormData = {
      ...formDataValue.value,
      ...data
    }

    const templateVariables = convertWorkflowVariableToTemplateVariable(allFormData, signatureDetail.value.workflowToTemplateMapping)
    // check if current step need to sign
    if (signatureDetail.value.signatureVariableSetting) {
      templateVariables[signatureDetail.value.signatureVariableSetting.id] =
        signatureDetail.value.templateVariables[signatureDetail.value.signatureVariableSetting.id]
    }
    const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(signatureDetail.value.templateDetail)))
    const content = signatureDetail.value.templateDetail.json.content.content
    signatureDetail.value.templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
    console.log('signatureDetail.value', signatureDetail.value)
  }
}

async function addTonalSubmit({ formData, booleanValue }: any) {
  state.loading = true
  if (!isAssigneeUser.value) {
    await clientApi.instance
      .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.db_id}/claim`, {
        user_id: userId
      })
      .then((res: any) => res.data)
  }

  const additionButtonActions: any = []
  additionalButtonRef.value.forEach((item) => {
    const submit = item.beforeSubmit()
    if (!!item && !!submit && item.booleanValue !== booleanValue) {
      additionButtonActions.push(submit)
    }
  })
  const buttonResults = await Promise.all(additionButtonActions)
  // after check all actions, if any additional data need to set to from data, set it
  buttonResults.forEach((item: any) => {
    if (item && typeof item === 'object') {
      formData = { ...formData, ...item }
    }
  })
  // conversion FormData
  const cFormData = conversionFormDataByVariables(formData, variables.value)

  clientApi.instance
    .post(`/oniflow/api/v1/processes/instance/${detail.process_instance_id}/tasks/${taskDetail.value.db_id}/complete`, {
      process_id: taskDetail.value.process_id,
      user_id: userId,
      variables: { ...cFormData }
    })
    .then((r: any) => r.data)

  routerProvider?.message.success(`${t('msg_successfulOperation')}`)
  if (backItem) {
    routerProvider?.back(backItem)
  } else {
    routerProvider?.replace(
      routeWorkflowPage({
        workflowType: workflowType
      })
    )
  }
  state.loading = false
}

async function handleTaskInfoChange(taskDetailRes: any) {
  handleDisabledForm()
}

function handleBack() {
  const newRoute = routeWorkflowPage({
    workflowType: workflowType
  })
  routerProvider?.navigateTo(newRoute)
}

onMounted(() => {
  const backLinks = routerProvider?.getHistory()
  if (!backItem && backLinks && backLinks.length > 0) {
    routerProvider?.updateProps({
      backItem: backLinks[backLinks.length - 1]
    })
  }
  if (backItem && backLinks.length === 0) {
    routerProvider?.addToHistory(backItem)
  }
  getDetail()
})
</script>

<template>
  <div v-if="!state.error" class="pageContainer--padding workflow-detail">
    <div class="wrapper">
      <h3>{{ state.title }}</h3>
      <el-tabs v-model="state.activeTab" class="dp-tabs--auto">
        <el-tab-pane class="workflow-detail-pane" :label="$t('workflow_info')" name="info">
          <WorkflowDetailCompleteInfo v-if="workflowType === 'completeTask'" :taskDetail="taskDetail" :state="workflowType" />
          <WorkflowDetailInfo v-else :taskDetail="taskDetail" @change="handleTaskInfoChange" />
        </el-tab-pane>

        <el-tab-pane v-if="showForm" class="workflow-detail-pane" :label="$t('workflow_form')" name="form">
          <div
            ref="workflowFormContainerRef"
            v-show="nodeType !== CellType.signatureTask || signSubmitStage !== 'afterSubmit'"
            :class="{ workflowFormContainer: true, [nodeType]: true, glass: nodeType === CellType.signatureTask && !isFullScreenForm, showForm }"
          >
            <div v-if="nodeType === CellType.signatureTask" class="toggleFormButton">
              <Icon :name="showForm ? 'tabler:arrow-right' : 'tabler:arrow-left'" size="20" @click="toggleShowForm" />
            </div>
            <div v-if="nodeType === CellType.signatureTask" class="toggleFullScreenButton">
              <Icon :name="isFullScreenForm ? 'tabler:minimize' : 'tabler:maximize'" size="20" @click="toggleFullScreenForm" />
            </div>
            <ContextFormRender ref="fromRenderRef" :taskDetail="taskDetail" @formChange="handleFormChange">
              <template #action>
                <div class="workflow-detail-pane--btns" v-if="isAssigneeUser">
                  <template v-for="(item, index) in additionalButton" :key="index">
                    <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="addTonalSubmit" />
                  </template>
                  <!--   TODO:  Save Draft is not supported.           -->
                  <!-- <el-button
                    v-if="!pageButtonSetting || pageButtonSetting.showSaveDraft"
                    id="Workflow__AvailableTask__Detail__Form__SaveDraft"
                    :disabled="workflowType === 'completeTask'"
                    @click="handleSave"
                  >
                    <template v-if="pageButtonSetting && pageButtonSetting.saveDraftLabel">
                      {{ pageButtonSetting.saveDraftLabel }}
                    </template>
                    <template v-else>
                      {{ $t('workflow_save') }}
                    </template>
                  </el-button>-->
                  <el-button
                    v-if="pageButtonSetting && (nodeType !== CellType.signatureTask || signSubmitStage === 'beforeSubmit')"
                    id="Workflow__AvailableTask__Detail__Form__Submit"
                    type="primary"
                    :disabled="workflowType === 'completeTask'"
                    @click="handleSubmit"
                  >
                    <template v-if="pageButtonSetting && pageButtonSetting.submitButtonLabel">
                      {{ pageButtonSetting.submitButtonLabel }}
                    </template>
                    <template v-else>
                      {{ $t('common_submit') }}
                    </template>
                  </el-button>
                </div>
              </template>
            </ContextFormRender>
          </div>

          <template v-if="nodeType === CellType.signatureTask">
            <!-- template viewer -->
            <div class="templateViewerContainer">
              <DocTemplateViewer
                ref="templateViewerRef"
                v-if="!!signatureDetail && !!signatureDetail.templateDetail.json"
                :options="signatureDetail.templateDetail.json.options"
                :json="signatureDetail.templateDetail.json.content"
              />
            </div>

            <div v-if="signSubmitStage === 'afterSubmit'" class="floatingButtonContainer glass">
              <el-button id="Workflow__AvailableTask__Detail__Form__Cancel" :disabled="workflowType === 'completeTask'" @click="handleCancel">
                {{ $t('cancelText') }}
              </el-button>
              <el-button
                id="Workflow__AvailableTask__Detail__Form__Confirm"
                type="primary"
                :disabled="workflowType === 'completeTask'"
                @click="openSignatureSettingDialog"
              >
                {{ $t('workflow_resign') }}
              </el-button>
              <el-button id="Workflow__AvailableTask__Detail__Form__Confirm" type="primary" :disabled="workflowType === 'completeTask'" @click="handleSubmit">
                {{ $t('common_submit') }}
              </el-button>
            </div>
            <WorkflowSignatureDialog ref="signatureSettingDialogRef" :signatureSetting="signatureDetail" @confirm="handleApplySignature" />
          </template>
        </el-tab-pane>

        <el-tab-pane :label="$t('workflow_graph')" name="graph">
          <!-- need to use v-if for bpmn, if not  svg graph will not show -->
          <WorkflowReplayViewer v-if="state.activeTab === 'graph'" ref="viewerRef" :taskDetail="taskDetail" :content-json="contentData" autoplay />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <div v-else>
    Workflow id not found, workflow id : {{ db_id }}.
    <el-button id="Workflow__AvailableTask__Detail__Form__Back" type="primary" @click="handleBack">
      {{ $t('common_back') }}
    </el-button>
    <p>{{ state.error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.floatingButtonContainer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: var(--app-space-s);
  z-index: 99;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
}

.pageContainer--padding.workflow-detail {
  display: grid;
  grid-template-columns: 1fr min-content;
  height: 100%;
  gap: var(--app-space-xs);
  overflow: hidden;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    grid-template-rows: min-content 1fr;
  }

  > .wrapper {
    display: flex;
    flex-flow: column nowrap;
    height: 100%;
    overflow: hidden;
    position: relative;
    gap: var(--app-space-s);

    > h3 {
      margin: 0;
    }
  }
}

.dp-tabs--auto {
  height: 100%;
  overflow: hidden;

  .el-tab-pane {
    height: 100%;
  }
}

.templateViewerContainer {
  position: relative;
  overflow: hidden;
}

.workflow-detail-pane {
  display: grid;
  grid-template-rows: 1fr min-content;
  transform: scale(1);

  &--btns {
    box-shadow: var(--el-box-shadow-light);
    padding: var(--app-space-s);
    display: flex;
    flex-flow: row nowrap;
    gap: var(--app-space-s);
    justify-content: flex-start;
    // text-align: right;
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}

.workflowFormContainer {
  position: relative;
  max-height: calc(100vh - 150px);

  &.UserTask {
  }

  &.SignatureTask {
    position: fixed;
    background: var(--app-grey-950);
    top: var(--app-space-xs);
    right: var(--app-space-xs);
    width: clamp(120px, 30vw, 400px);
    height: calc(100% - var(--app-space-xs) * 2);
    padding: var(--app-space-l) var(--app-space-s) var(--app-space-s) var(--app-space-s);
    border-radius: var(--app-border-radius-m);
    z-index: 99;
    transition: all 0.2s ease-in-out;
    transform: translateX(90%);

    &.showForm {
      transform: translateX(0);
    }

    &.glass {
      background-color: transparent;
      background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, var(--app-primary-alpha-30) 2%, var(--app-primary-alpha-50) 100%);
    }
  }
}

.toggleFullScreenButton {
  position: absolute;
  top: var(--app-space-s);
  right: var(--app-space-s);
  z-index: 2;
  cursor: pointer;

  &:hover {
    color: var(--app-primary-color);
  }
}

.toggleFormButton {
  position: absolute;
  top: var(--app-space-s);
  left: var(--app-space-s);
  z-index: 2;
  cursor: pointer;

  &:hover {
    color: var(--app-primary-color);
  }
}
</style>
