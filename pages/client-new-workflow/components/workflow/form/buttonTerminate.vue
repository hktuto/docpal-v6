<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { routeWorkflowPage, workflowResponseHelper } from '#imports'

const props = defineProps<{
  disabled?: boolean
  buttonId?: string
}>()

const { workflowType, taskDetail, disabled: formDisabled, onActionSuccess } = useWorkflowFormInject()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const loading = ref(false)

const isDisabled = computed(() => props.disabled ?? formDisabled.value)

async function handleTerminate() {
  const processInstanceId = taskDetail.value?.process_id
  if (!processInstanceId) {
    routerProvider?.message.error('Process instance id not found')
    return
  }

  try {
    const action = await ElMessageBox.confirm(t('workflow_terminateConfirmMsg'), {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('workflow_terminate')
    })
    if (action !== 'confirm') return

    loading.value = true
    await clientApi.instance.delete(`/oniflow/api/v1/processes/instance/${processInstanceId}/terminated`).then((r: any) => workflowResponseHelper(r))

    routerProvider?.message.success(t('msg_successfulOperation'))
    const dbId = taskDetail.value?.db_id
    if (onActionSuccess && dbId) {
      onActionSuccess({ action: 'terminate', dbId, processId: processInstanceId })
    } else {
      routerProvider?.replace(
        routeWorkflowPage({
          workflowType: workflowType.value
        })
      )
    }
  } catch (error: any) {
    if (error === 'cancel') return
    routerProvider?.message.error(error?.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-button
    :id="buttonId || 'Workflow__AvailableTask__Detail__Form__Terminate'"
    type="danger"
    :disabled="isDisabled"
    :loading="loading"
    @click="handleTerminate"
  >
    {{ $t('workflow_terminate') }}
  </el-button>
</template>
