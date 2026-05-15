<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'
import { getButtonAdditionalElement, getWorkflowList } from '@packages/workflow/utils/workflowHelper'
import { conversionFormDataByVariables, newWorkflowStartPage } from '#imports'

const vFormRef = ref()
const workflowEditorRef = ref()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)
const activeName = ref('Form')
const state = reactive({
  formDialogVisible: false,
  selectedWorkflow: {},
  loading: false
})
const emits = defineEmits(['reload'])
const pageButtonSetting = ref<any>(null)
const openWorkflowEdit = ref(false)
const userId = useUserId()
const workflowList = await getWorkflowList()

async function workflowClickHandler(workflowItem: any) {
  state.loading = true
  openWorkflowEdit.value = false
  openWorkflowEdit.value = true
  const data = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${workflowItem.id}`).then((r: any) => r.data.data)
  if (!data) return
  if (data.published_version < 1) {
    state.loading = false
    routerProvider?.message.error('Workflow has not been released.')
    return
  }

  // Workflow未發佈
  if (Object.keys(data.content).length === 0) {
    state.loading = false
    routerProvider?.message.error('Workflow has not been released.')
    return
  }

  const startTask = data.content.nodes.find((item: any) => item.id === 'system_start_event')
  if (!startTask) {
    state.loading = false
    routerProvider?.message.error('Start Task missing')
    return
  }

  state.selectedWorkflow = deepCopy(data)

  if (startTask.flow.outgoing.length === 0) {
    routerProvider?.message.error('Workflow No process')
    return
  }

  // Check if the next node of the start task is a user task
  const nextTaskId = startTask.flow.outgoing[0]
  const nextTaskNode = data.content.nodes.find((item: any) => item.id === nextTaskId)
  if (!nextTaskNode || nextTaskNode.type !== CellType.userTask) {
    // run workflow by service
    await directlyStart(data.id)
    state.loading = false
    return
  }

  // nextTaskNode Task has no set E-Form
  if (!nextTaskNode.config.human_task.form_key || nextTaskNode.config.human_task.form_key === '') {
    await directlyStart(data.id)
    state.loading = false
    return
  }

  // Open in new page
  if (startTask.metadata.openInNewPage) {
    state.loading = false
    const link = newWorkflowStartPage(data.name, data.id, nextTaskNode, data.content.variables)
    routerProvider?.navigateTo(link)
    return
  }

  state.formDialogVisible = true
  await initForm(nextTaskNode)
}

async function directlyStart(definition_id: string) {
  try {
    const formParams = {
      start_user_id: userId.value,
      definition_id: definition_id,
      variables: {
        __system__user_creator_id: userId.value
      }
    }
    await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data.data)
  } catch (e) {
    console.log(e)
  }
}

async function initForm(nextTaskNode: any) {
  const formKey = nextTaskNode.config.human_task.form_key
  if (!formKey) {
    state.loading = false
    state.formDialogVisible = false
    return
  }

  const formJson = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
  if (!formJson || !formJson.jsonValue) return {}
  state.loading = false
  await handleAdditionalSetting(nextTaskNode.metadata)
  // @ts-ignore
  nextTick(() => {
    vFormRef.value.setForm(formJson.jsonValue)
  })
}

async function handleAdditionalSetting(metadata: any) {
  const { buttonSetting, signatureSetting } = await getButtonAdditionalElement([], metadata, {})
  if (buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

async function checkAndSubmit() {
  state.loading = true
  const formData = await vFormRef.value.getFormData()

  if (!!formData) {
    // conversion FormData
    const cFormData = conversionFormDataByVariables(formData, state.selectedWorkflow.content.variables)

    const formParams = {
      start_user_id: userId.value,
      definition_id: state.selectedWorkflow.id,
      variables: {
        ...cFormData,
        __system__user_creator_id: userId.value
      }
    }

    try {
      const data = await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data.data)
      state.formDialogVisible = false

      setTimeout(async () => {
        // Check workflow running status
        const newVar = await $api.get(`/oniflow/api/v1/processes/instance/${data.process_id}`).then((r: any) => r.data.data)
        if (newVar.state === 'running') {
          ElMessage.success('Workflow created')
        }

        // run User Task
        // TODO 上述接口缺少返回 task ID
        // $api.post(`/oniflow/api/v1/processes/instance/${data.process_id}/tasks/${data.db_id}/complete`, {
        //     process_id: taskDetail.value.process_id,
        //     user_id: userId,
        //     variables: { ...cFormData }
        //   })
        //   .then((r: any) => r.data)
      }, 100)
    } catch (e) {
      console.log(e)
    }
  }
  state.loading = false
  emits('reload')
}

defineExpose({ workflowClickHandler })
</script>

<template>
  <el-dropdown id="Workflow__NewWorkflow" popper-class="popover-auto" trigger="click" @command="workflowClickHandler">
    <el-button type="primary" :loading="state.loading">
      {{ $t('workflow_newWorkflow') }}
      <el-icon class="el-icon--right">
        <arrow-down />
      </el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="wf in workflowList" :key="wf.id" :command="wf">
          {{ wf.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <el-dialog
    v-model="state.formDialogVisible"
    :title="state.selectedWorkflow.name"
    destroy-on-close
    append-to-body
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
    <el-tabs v-if="state.formDialogVisible" v-model="activeName" v-loading="state.loading">
      <el-tab-pane v-loading="state.loading" :label="$t('workflow_form')" name="Form">
        <ContextFormRender ref="vFormRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_graph')" name="Graph">
        <div v-if="openWorkflowEdit" class="pageContainer">
          <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="state.selectedWorkflow" :readonly="true" :showSidebar="false" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button
        v-if="!pageButtonSetting || pageButtonSetting.showSubmitButton"
        id="Workflow__NewWorkflow__StartWorkflow"
        type="primary"
        :disabled="state.loading"
        @click="checkAndSubmit"
      >
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

<style lang="scss" scoped>
.pageContainer {
  width: 100%;
  height: 100%;
}
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
