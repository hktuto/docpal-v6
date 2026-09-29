<script lang="ts" setup>
import { clientApi } from 'api'
import { routeWorkflowPage, CellType, conversionFormDataByVariables } from '#imports'
import { generateData, replaceVariables } from 'docpal-document-editor/src/utils'
import { convertWorkflowVariableToTemplateVariable } from '@packages/workflow/utils/workflowHelper'

const {
  workflowType,
  taskDetail,
  variables,
  isAssigneeUser,
  nodeType,
  signSubmitStage,
  signatureDetail,
  temSignatureData,
  formDataValue,
  pageButtonSetting,
  additionalButton,
  showForm,
  disabled,
  onActionSuccess
} = useWorkflowFormInject()
const user = useUserState()
const isAdmin = computed(() => {
  const find = user.value.aclUserDetail.groups.find((item: any) => item.groupId === 'administrators')
  return find !== undefined
})
const routerProvider = inject(MenuRouterKey)
const userId: string = useUserId().value
const { t } = useI18n()

const fromRenderRef = ref()
const additionalButtonRef = ref<any[]>([])
const signatureSettingDialogRef = ref<any>(null)
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
  { immediate: true }
)

function toggleFullScreenForm() {
  isFullScreenForm.value = !isFullScreenForm.value
  if (isFullScreenForm.value) {
    workflowFormContainerRef.value?.requestFullscreen?.()
  } else {
    document.exitFullscreen()
  }
}

function toggleShowForm() {
  showForm.value = !showForm.value
}

function openSignatureSettingDialog() {
  signatureSettingDialogRef.value?.open?.()
}

async function handleFormChange() {
  if (nodeType.value !== CellType.signatureTask || !signatureDetail.value) return

  const data = await fromRenderRef.value.getFormData(true, false)
  const allFormData = {
    ...formDataValue.value,
    ...data
  }
  const templateVariables = convertWorkflowVariableToTemplateVariable(allFormData, signatureDetail.value.workflowToTemplateMapping)
  if (signatureDetail.value.signatureVariableSetting) {
    templateVariables[signatureDetail.value.signatureVariableSetting.id] =
      signatureDetail.value.templateVariables[signatureDetail.value.signatureVariableSetting.id]
  }
  const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(signatureDetail.value.templateDetail)))
  const content = signatureDetail.value.templateDetail.json.content.content
  signatureDetail.value.templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
}

async function handleApplySignature(newSignature: any) {
  const data = await fromRenderRef.value.getFormData(true, false)
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

async function addTonalSubmit({ formData, booleanValue }: any) {
  if (!isAssigneeUser.value) {
    await clientApi.instance
      .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/claim`, {
        user_id: userId
      })
      .then((res: any) => res.data)
  }

  const additionButtonActions: any[] = []
  additionalButtonRef.value.forEach((item) => {
    const submit = item.beforeSubmit()
    if (!!item && !!submit && item.booleanValue !== booleanValue) {
      additionButtonActions.push(submit)
    }
  })
  const buttonResults = await Promise.all(additionButtonActions)
  buttonResults.forEach((item: any) => {
    if (item && typeof item === 'object') {
      formData = { ...formData, ...item }
    }
  })

  const cFormData = conversionFormDataByVariables(formData, variables.value)
  await clientApi.instance
    .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/complete`, {
      process_id: taskDetail.value.process_id,
      user_id: userId,
      variables: { ...cFormData }
    })
    .then((r: any) => r.data)

  routerProvider?.message.success(`${t('msg_successfulOperation')}`)
  const dbId = taskDetail.value?.db_id
  if (onActionSuccess && dbId) {
    onActionSuccess({ action: 'submit', dbId, processId: taskDetail.value?.process_id })
  } else {
    routerProvider?.replace(
      routeWorkflowPage({
        workflowType: workflowType.value
      })
    )
  }
}

defineExpose({
  setForm: (jsonValue: any, data: any) => fromRenderRef.value?.setForm?.(jsonValue, data),
  disableForm: () => fromRenderRef.value?.disableForm?.(),
  enableForm: () => fromRenderRef.value?.enableForm?.(),
  updateData: (data: any) => fromRenderRef.value?.updateData?.(data),
  getFormData: (needValidation: boolean, skip?: boolean) => fromRenderRef.value?.getFormData?.(needValidation, skip),
  getAdditionalButtons: () => additionalButtonRef.value || [],
  openSignatureSettingDialog
})
</script>

<template>
  <div class="workflow-form-root">
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
          <div v-if="isAssigneeUser" class="workflow-form__button-list">
            <template v-for="(item, index) in additionalButton" :key="index">
              <component :is="item.component" ref="additionalButtonRef" v-bind="item.props" @submit="addTonalSubmit" />
            </template>

            <WorkflowFormButtonTerminate v-if="isAdmin" button-id="Workflow__AvailableTask__Detail__Form__Terminate" />

            <WorkflowFormButtonSubmit
              v-if="pageButtonSetting && (nodeType !== CellType.signatureTask || signSubmitStage === 'beforeSubmit')"
              button-id="Workflow__AvailableTask__Detail__Form__Submit"
              :label-key="pageButtonSetting?.submitButtonLabel || 'common_submit'"
            />
          </div>
        </template>
      </ContextFormRender>
    </div>

    <template v-if="nodeType === CellType.signatureTask">
      <div class="templateViewerContainer">
        <DocTemplateViewer
          v-if="!!signatureDetail && !!signatureDetail.templateDetail.json"
          :options="signatureDetail.templateDetail.json.options"
          :json="signatureDetail.templateDetail.json.content"
        />
      </div>

      <div v-if="signSubmitStage === 'afterSubmit'" class="floatingButtonContainer glass">
        <SignatureButtonCancel button-id="Workflow__AvailableTask__Detail__Form__Cancel" />
        <el-button id="Workflow__AvailableTask__Detail__Form__Confirm" type="primary" :disabled="disabled" @click="openSignatureSettingDialog">
          {{ $t('workflow_resign') }}
        </el-button>
        <WorkflowFormButtonSubmit button-id="Workflow__AvailableTask__Detail__Form__Confirm" label-key="common_submit" />
      </div>
      <SignatureDialog ref="signatureSettingDialogRef" :signatureSetting="signatureDetail" @confirm="handleApplySignature" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.workflow-form-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

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

.templateViewerContainer {
  position: relative;
  overflow: hidden;
}

.workflow-form__button-list {
  flex-shrink: 0;
  box-shadow: var(--el-box-shadow-light);
  padding: var(--app-space-s);
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  justify-content: flex-start;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.workflowFormContainer {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;

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
