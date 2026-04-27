<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import { getButtonAdditionalElement, getWorkflowList } from '@packages/workflow/utils/workflowHelper'
import { newWorkflowStartPage } from '../../../../../../pages/client-new-workflow/utils/routerHelper'

const vFormRef = ref()
const workflowEditorRef = ref()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)
const activeName = ref('Form')
const state = reactive({
  availableWorkflow: [],
  formDialogVisible: false,
  selectedWorkflow: {},
  bpmnXml: null,
  loading: false
})
const emits = defineEmits(['reload'])
const pageButtonSetting = ref<any>(null)
const openWorkflowEdit = ref(false)
const userId = useUserId()

const { workflowList } = await getWorkflowList()

async function workflowClickHandler(item: any) {
  state.loading = true
  openWorkflowEdit.value = false
  openWorkflowEdit.value = true
  const data = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${item.id}`).then((r: any) => r.data)
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

  // Open in new page
  if (startTask.metadata.openInNewPage) {
    state.loading = false
    const link = newWorkflowStartPage(data.name, state.selectedWorkflow.id, startTask.metadata.formKey)
    routerProvider?.navigateTo(link, true)
    return
  }

  // start Task has no set E-Form
  if (!startTask.metadata.formKey || startTask.metadata.formKey === '') {
    // Directly Submit form
    try {
      const formParams = {
        start_user_id: userId.value,
        definition_id: state.selectedWorkflow.id,
        variables: {
          __system__user_creator_id: userId
        }
      }

      await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data)
    } catch (e) {
      console.log(e)
    }

    return
  }

  state.formDialogVisible = true
  await initForm(startTask)
}

async function initForm(startTask: any) {
  const formKey = startTask.metadata?.formKey
  if (!formKey) {
    state.loading = false
    state.formDialogVisible = false
    return
  }

  const formJson = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
  if (!formJson || !formJson.jsonValue) return {}
  state.loading = false
  await handleAdditionalSetting(startTask.metadata)
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
    const formParams = {
      start_user_id: userId.value,
      definition_id: state.selectedWorkflow.id,
      variables: {
        ...formData,
        __system__user_creator_id: userId
      }
    }

    try {
      const data = await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data)
      state.formDialogVisible = false

      setTimeout(async () => {
        // Check workflow running status
        const newVar = await $api.get(`/oniflow/api/v1/processes/instance/${data.id}`).then((r: any) => r.data)
        if (newVar.state === 'running') {
          ElMessage.success('Workflow created')
        }
      }, 100)
    } catch (e) {
      console.log(e)
    }
  }
  state.loading = false
  emits('reload')
}

onMounted(() => {})
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
