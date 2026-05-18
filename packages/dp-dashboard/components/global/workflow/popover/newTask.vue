<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { newClientApi } from 'api'
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'
import { conversionFormDataByVariables, newWorkflowStartPage } from '#imports'

const vFormRef = ref()
const workflowEditorRef = ref()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)
const activeName = ref('Form')
const state = reactive({
  formDialogVisible: false,
  selectedWorkflow: {},
  formVariables: [],
  loading: false
})
const emits = defineEmits(['reload'])
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

  state.selectedWorkflow = deepCopy(data)

  // Workflow 未發佈
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

  // 未配置流程
  if (startTask.flow.outgoing.length === 0) {
    routerProvider?.message.error('Workflow No process')
    return
  }

  // Start Task has no set E-Form
  if (!startTask.config?.initialise?.form_key || startTask.config?.initialise?.form_key === '') {
    await directlyStart(data.id)
    state.loading = false
    return
  }

  // Open in new page
  if (startTask.metadata.openInNewPage) {
    state.loading = false
    const link = newWorkflowStartPage(data.name, data.id, startTask)
    routerProvider?.navigateTo(link)
    return
  }

  state.formVariables = startTask.config?.initialise?.form_fields || []
  state.formDialogVisible = true
  await initForm(startTask)
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

async function initForm(taskNode: any) {
  const formKey = taskNode.config.initialise.form_key

  const formJson = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
  if (!formJson || !formJson.jsonValue) return {}
  state.loading = false
  // @ts-ignore
  nextTick(() => {
    vFormRef.value.setForm(formJson.jsonValue)
  })
}

async function checkAndSubmit() {
  state.loading = true
  const formData = await vFormRef.value.getFormData()

  if (!!formData) {
    // conversion FormData
    const cFormData = conversionFormDataByVariables(formData, state.formVariables)

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
      <el-button id="Workflow__NewWorkflow__StartWorkflow" type="primary" :disabled="state.loading" @click="checkAndSubmit">
        {{ $t('common_submit') }}
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
