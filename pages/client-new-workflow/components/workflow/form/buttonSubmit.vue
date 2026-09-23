<script lang="ts" setup>
import { clientApi } from 'api'
import { CellType, conversionFormDataByVariables, routeWorkflowPage, workflowResponseHelper } from '#imports'

const props = defineProps<{
  disabled?: boolean
  labelKey?: string
  buttonId?: string
}>()

const {
  workflowType,
  taskDetail,
  variables,
  isAssigneeUser,
  nodeType,
  signSubmitStage,
  signatureDetail,
  temSignatureData,
  disabled: formDisabled,
  getFormData,
  getAdditionalButtons,
  openSignatureSettingDialog,
  onActionSuccess
} = useWorkflowFormInject()

const routerProvider = inject(MenuRouterKey)
const userId: string = useUserId().value
const { t } = useI18n()
const loading = ref(false)

const isDisabled = computed(() => props.disabled ?? formDisabled.value)

async function handleSubmitUserTask() {
  let formData = await getFormData(true, false)
  if (signSubmitStage.value === 'afterSubmit' && signatureDetail.value) {
    formData[signatureDetail.value.workflowKeyToStoreSignature] = temSignatureData.value
  }

  if (!formData) throw new Error(`${t('incompleteData')}`)

  const additionButtonActions: any[] = []
  getAdditionalButtons().forEach((item) => {
    if (item && item.beforeSubmit) {
      additionButtonActions.push(item.beforeSubmit())
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
      variables: cFormData
    })
    .then((r: any) => workflowResponseHelper(r))
}

async function handleSubmitServiceTask() {
  const formData = await getFormData(true, false)
  const cFormData = conversionFormDataByVariables(formData, variables.value)
  await clientApi.instance
    .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/execute`, {
      process_id: taskDetail.value.process_id,
      variables: cFormData
    })
    .then((r: any) => workflowResponseHelper(r))
}

async function handleSubmit() {
  if (
    nodeType.value === CellType.signatureTask &&
    signSubmitStage.value === 'beforeSubmit' &&
    signatureDetail.value?.signatureVariableSetting
  ) {
    openSignatureSettingDialog()
    return
  }

  loading.value = true
  try {
    if (!isAssigneeUser.value) {
      await clientApi.instance
        .post(`/oniflow/api/v1/processes/instance-task/${taskDetail.value.db_id}/claim`, {
          user_id: userId
        })
        .then((res: any) => res.data)
    }

    if (nodeType.value === CellType.userTask || nodeType.value === CellType.signatureTask) {
      await handleSubmitUserTask()
    } else {
      await handleSubmitServiceTask()
    }

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
  } catch (error: any) {
    if (error?.message === '__CANCEL__' || error?.message === '**CANCEL**') return
    routerProvider?.message.error(error?.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-button
    :id="buttonId || 'Workflow__AvailableTask__Detail__Form__Submit'"
    type="primary"
    :disabled="isDisabled"
    :loading="loading"
    @click="handleSubmit"
  >
    {{ $t(labelKey || 'common_submit') }}
  </el-button>
</template>
