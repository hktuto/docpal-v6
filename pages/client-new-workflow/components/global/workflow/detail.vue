<script lang="ts" setup>
import { newClientApi } from 'api'
import { routeWorkflowPage } from '~/utils/routerHelper'
import { generateData, replaceVariables } from 'docpal-document-editor/src/utils'
import { CellType } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { detail, workflowType, backItem } = defineProps<{
  detail: {
    id: string
    process_instance_id: string
    definition_id: string
    node_id: string
    node_name: string
    assignee: string
    variables: any
  }
  workflowType: string
  backItem?: any
}>()
// @ts-ignore
const userId: string = useUserId().value
const isMobile = false
const { t } = useI18n()
const state = reactive<any>({
  processState: {
    completeTask: 'completeTask'
  },
  activeTab: 'form',
  activityList: [],
  loading: true,
  submitShow: false,
  error: null
})
const fromRenderRef = ref()
const taskDetail = ref({})
const workflowJson = ref({})
const nodeTags = ref(false)
const isAssigneeUser = computed(() => {
  return !detail?.assignee || detail?.assignee === userId
})

async function getDetail() {
  taskDetail.value = detail
  try {
    state.loading = true
    state.error = null
    switch (workflowType) {
      case state.processState.completeTask:
        const historyList: any = await newClientApi
          .postDocpalWorkflowHistoryProcess({
            processInstanceId: id,
            completed: true
          })
          .then((res) => res?.data?.entryList)
        if (!!historyList && historyList.length > 0) {
          taskDetail.value = historyList[0]
        }
        break
      default:
        const workflowTaskInstance = await $api
          .get(`/oniflow/api/v1/workflow/definitions/instance/${detail.definition_id}`)
          .then((r) => r.data)
        workflowJson.value = workflowTaskInstance.content

        const data = await $api.get(`/oniflow/api/v1/processes/instance/${detail.process_instance_id}`).then((r) => r.data)

        const findNode = data.nodes.find((node: any) => node.id == detail.node_id)
        if (!!findNode) {
          nodeTags.value = findNode.metadata.tags
          switch (nodeTags.value) {
            case CellType.userTask:
              await initForm(findNode)
              break
            case CellType.signatureTask:
              break
            default:
          }
          await handleAdditionalSetting(findNode.metadata)
        }
    }
    // handleGetActivity()
  } catch (error) {
    state.error = error
  }
  // setTimeout(async () => {
  //   try {
  //     await handleFormDataGet()
  //     handleDisabledForm()
  //   } catch (error) {
  //     console.log(error)
  //   }
  //   state.loading = false
  // }, 100)
  state.loading = true
}

async function initForm(node: any) {
  const formKey = node.metadata.formKey
  if (!formKey){
    routerProvider?.message.error('The form does not exist!')
    return
  }

  // Get Form Json
  const formJsonData = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
  if (!formJsonData || !formJsonData.jsonValue) {
    routerProvider?.message.error('The form does not exist!')
    return
  }
  // Get Form Data
  let formData = {}
  const taskDetailData = await $api.get(`/oniflow/api/v1/tasks/instance/${detail.id}`).then((r) => r.data)
  if (!!taskDetailData && !!taskDetailData.input_variables) {
    formData = taskDetailData.input_variables
  }
  fromRenderRef.value.setForm(formJsonData.jsonValue, formData)
  handleDisabledForm()
}

async function handleGetActivity() {
  const processInstanceId = taskDetail.value.instanceId || taskDetail.value.processInstanceId
  state.activityList = await newClientApi
    .postDocpalWorkflowHistoryActivity({ processInstanceId })
    .then((res: any) => res.data?.list.filter((i) => i.activityName).reverse())
}

// #region module: form
const displayMode = ref<'form' | 'signature'>()

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

async function handleFormDataGet() {
  // Get Form Data
  await $api.get(`/oniflow/api/v1/processes/variable/${id}/variables`).then((r) => r.data)

  if (!formJsonData) {
    throw Error('Get form JSON Error')
  }
  formJsonData.jsonValue
}

function toggleShowForm() {
  showForm.value = !showForm.value
}

function formDataGet(obj: any) {
  if (!obj) obj = {}
  return Object.keys(obj).reduce((prev: any, key: string) => {
    prev[key] = String(obj[key])
    return prev
  }, {})
}

function handleDisabledForm() {
  if (!isAssigneeUser.value || workflowType === 'completeTask') {
    fromRenderRef.value.disableForm()
  }
}

async function handleSave() {
  try {
    const data = await fromRenderRef.value.getFormData(false, false)
    state.loading = true
    const param = {
      taskId: id,
      properties: { ...data }
    }
    await newClientApi.postDocpalWorkflowPropertiesSave(param)
    routerProvider?.message.success(`${t('msg_successfulOperation')}`)
  } catch (error) {
    console.log(error)
    // routerProvider?.message.error(error)
  } finally {
    // state.loading = false
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

function handleResign() {
  openSignatureSettingDialog()
}

async function handleSubmit() {
  // if displayMode is signature, and signSubmitStage is beforeSubmit, do not submit form, open signature setting dialog
  if (displayMode.value === CellType.signatureTask && signSubmitStage.value === 'beforeSubmit' && signatureDetail.value.signatureVariableSetting) {
    openSignatureSettingDialog()
    return
  }
  state.loading = true
  try {
    if (detail.assignee !== userId) {
      await $api
        .post(`/oniflow/api/v1/tasks/instance/${taskDetail.value.id}/claim`, {
          user_id: userId,
          process_id: taskDetail.process_instance_id
        })
        .then((res) => res.data)
    }

    // User Task
    switch (nodeTags.value) {
      case CellType.userTask || CellType.signatureTask:
        await handleSubmitUserTask()
        break
      default:
        await handleSubmitServiceTask()
    }

    routerProvider?.message.success(`${t('msg_successfulOperation')}`)
    const fallbackRoute = routeWorkflowPage({
      workflowType: workflowType
    })
    routerProvider?.back(fallbackRoute)
  } catch (error) {
    console.log('error', error)
    routerProvider?.message.error(error.message)
  } finally {
    state.loading = false
  }
}

async function handleSubmitUserTask() {
  // get form fromData
  let fromData = await fromRenderRef.value.getFormData(true, false)
  if (signSubmitStage.value === 'afterSubmit') {
    fromData[signatureDetail.value.workflowKeyToStoreSignature] = temSignatureData.value
  }

  if (!fromData) throw new Error(`${t('incompleteData')}`)

  // check additional button
  // if additional button has expose "beforeSubmit" method, call it
  const additionButtonActions: any = []
  additionalButtonRef.value.forEach((item) => {
    if (item && item.beforeSubmit) {
      additionButtonActions.push(item.beforeSubmit())
    }
  })

  const buttonResults = await Promise.all(additionButtonActions)
  // after check all actions, if any addtional fromData need to set to from fromData, set it
  buttonResults.forEach((item: any) => {
    if (item && typeof item === 'object') {
      fromData = { ...fromData, ...item }
    }
  })

  Object.keys(fromData).forEach((key) => {
    if (typeof fromData[key] === 'object') {
      fromData[key] = JSON.stringify(fromData[key])
    }
  })

  const data = $api
    .post(`/oniflow/api/v1/processes/instance/${detail.process_instance_id}/tasks/${taskDetail.value.id}/complete`, {
      user_id: userId,
      variables: fromData
    })
    .then((r) => r.data)
  console.log('--- handleSubmitUserTask: ', data)
}

async function handleSubmitServiceTask() {
  const fromData = await fromRenderRef.value.getFormData(true, false)
  const data = $api
    .post(`/oniflow/api/v1/processes/instance/${detail.process_instance_id}/tasks/${taskDetail.value.id}/execute`, {
      variables: fromData
    })
    .then((r) => r.data)
  console.log('--handleSubmitServiceTask: ', data)
}

type AdditionalButton = {
  props: any
  component: string
}
const additionalButton = ref<AdditionalButton[]>([])
const additionalButtonRef = ref<any[]>([])
const signatureDetail = ref<any>(null)
const pageButtonSetting = ref<any>(null)
const temSignatureData = ref<any>(null)

async function handleApplySignature(newSignature: any) {
  // temp add signature to form data and update signature setting variable
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

async function handleAdditionalSetting(metadata: any) {
  if (metadata.buttonSetting) {
    pageButtonSetting.value = metadata.buttonSetting
  }
  displayMode.value = metadata.tags
  if (metadata.tags === CellType.signatureTask) {
    signatureDetail.value = signatureSetting
    signSubmitStage.value = 'beforeSubmit'
  } else {
    signatureDetail.value = null
  }
}

async function handleFormChange() {
  if (displayMode.value === 'signature') {
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

async function addTonalSubmit({ formData, attr_booleanValue }: any) {
  state.loading = true
  if (taskDetail.value?.assignee !== userId) {
    await newClientApi.postWorkflowTaskClaim({ taskId: id, userId }).then((res) => res.data)
  }

  const additionButtonActions: any = []
  additionalButtonRef.value.forEach((item) => {
    if (item && item.beforeSubmit && item.attr_booleanValue !== attr_booleanValue) {
      additionButtonActions.push(item.beforeSubmit())
    }
  })
  const buttonResults = await Promise.all(additionButtonActions)
  // after check all actions, if any addtional data need to set to from data, set it
  buttonResults.forEach((item: any) => {
    if (item && typeof item === 'object') {
      formData = { ...formData, ...item }
    }
  })
  const param = {
    taskId: id,
    properties: { ...formData }
  }
  const res: any = await newClientApi.postDocpalWorkflowFormSubmit(param).then((res) => res.data)
  routerProvider?.message.success(`${t('msg_successfulOperation')}`)
  if (backItem) {
    routerProvider?.back(backItem)
  } else {
    const fallbackRoute = routeWorkflowPage({
      workflowType: workflowType
    })
    routerProvider?.back(fallbackRoute)
  }
  state.loading = false
}

const handleTaskInfoChange = async (taskDetailRes: any, isClaim: boolean) => {
  try {
    state.taskDetail = { ...taskDetailRes }
    handleGetActivity()
    if (!isAssigneeUser.value) {
      state.loading = true
      await handleFormDataGet()
    } else {
      fromRenderRef.value.disableForm()
    }
  } catch (error) {}
  // state.loading = false
}

function tabChange(tab: string) {
  // router.push({query: { tab, state: workflowType }})
}

function handleBack() {
  routerProvider?.navigateTo(
    routeWorkflowPage({
      workflowType: workflowType
    }),
    false
  )
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
  {{ state.error }}
  <div v-if="!state.error" class="pageContainer--padding workflow-detail">
    <div class="wrapper">
      <h3>{{ workflowJson.name }}</h3>
      <el-tabs v-model="state.activeTab" class="dp-tabs--auto" @tab-change="tabChange">
        <el-tab-pane class="workflow-detail-pane" :label="$t('workflow_info')" name="info">
          <WorkflowDetailCompleteInfo v-if="state.processState[workflowType]" :taskDetail="state.taskDetail" :state="workflowType" />
          <WorkflowDetailInfo v-else :taskDetail="detail" @change="handleTaskInfoChange" />
        </el-tab-pane>
        <el-tab-pane class="workflow-detail-pane" :label="$t('workflow_form')" name="form">
          <div
            ref="workflowFormContainerRef"
            v-show="displayMode !== 'signature' || signSubmitStage !== 'afterSubmit'"
            :class="{ workflowFormContainer: true, [displayMode]: true, glass: displayMode === 'signature' && !isFullScreenForm, showForm }"
          >
            <div v-if="displayMode === 'signature'" class="toggleFormButton">
              <Icon :name="showForm ? 'tabler:arrow-right' : 'tabler:arrow-left'" size="20" @click="toggleShowForm" />
            </div>
            <div v-if="displayMode === 'signature'" class="toggleFullScreenButton">
              <Icon :name="isFullScreenForm ? 'tabler:minimize' : 'tabler:maximize'" size="20" @click="toggleFullScreenForm" />
            </div>

            <ContextFormRender ref="fromRenderRef" @formChange="handleFormChange">
              <template #action>
                <div class="workflow-detail-pane--btns" v-if="isAssigneeUser">
                  <template v-for="(item, index) in additionalButton" :key="index">
                    <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="addTonalSubmit" />
                  </template>
<!--   TODO:  Save Draft is not supported.           -->
<!--                  <el-button-->
<!--                    v-if="!pageButtonSetting || pageButtonSetting.showSaveDraft"-->
<!--                    id="Workflow__AvailableTask__Detail__Form__SaveDraft"-->
<!--                    :disabled="workflowType === 'completeTask'"-->
<!--                    @click="handleSave"-->
<!--                  >-->
<!--                    <template v-if="pageButtonSetting && pageButtonSetting.saveDraftLabel">-->
<!--                      {{ pageButtonSetting.saveDraftLabel }}-->
<!--                    </template>-->
<!--                    <template v-else>-->
<!--                      {{ $t('workflow_save') }}-->
<!--                    </template>-->
<!--                  </el-button>-->

                  <el-button
                    v-if="(!pageButtonSetting || pageButtonSetting.showSumBitButton) && (displayMode !== 'signature' || signSubmitStage === 'beforeSubmit')"
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
          <template v-if="displayMode === 'signature'">
            <!-- template viewer -->
            <div class="templateViewerContainer">
              <!-- {{ signatureDetail.templateDetail }} -->
              <DocTemplateViewer
                ref="templateViewerRef"
                v-if="!state.isEdit && signatureDetail"
                :options="signatureDetail.templateDetail.json.options"
                :json="signatureDetail.templateDetail.json.content"
              />
            </div>
            <div v-if="signSubmitStage === 'afterSubmit'" class="floatingButtonContainer glass">
              <el-button id="Workflow__AvailableTask__Detail__Form__Cancel" :disabled="workflowType === 'completeTask'" @click="handleCancel">
                {{ $t('cancelText') }}
              </el-button>
              <el-button id="Workflow__AvailableTask__Detail__Form__Confirm" type="primary" :disabled="workflowType === 'completeTask'" @click="handleResign">
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
          <WorkflowDetailGraph
            v-if="state.activeTab === 'graph'"
            :processDefinitionId="state.taskDetail?.processDefinitionId || state.taskDetail?.taskInstance?.processDefinitionId"
            :processDefinitionVersionId="state.taskDetail?.processDefinitionVersionId"
            :deploymentId="state.taskDetail?.deploymentId || state.taskDetail?.taskInstance?.deploymentId"
            :steps="state.activityList"
          />
        </el-tab-pane>

        <el-tab-pane v-if="state.taskDetail && state.taskDetail.instanceId && isMobile" :label="$t('common_discussionChannel')" name="command">
          <WorkflowDetailDiscussionChannel :id="state.taskDetail.instanceId" :noToggle="true" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <WorkflowDetailDiscussionChannel v-if="state.taskDetail && state.taskDetail.instanceId && !isMobile" :id="state.taskDetail.instanceId" />
  </div>
  <div v-else>
    Workflow id not found, workflow id : {{ id }}.
    <el-button id="Workflow__AvailableTask__Detail__Form__Back" type="primary" @click="handleBack">
      {{ $t('common_back') }}
    </el-button>
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

  &.form {
  }

  &.signature {
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
