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
        <el-dropdown-item v-for="wf in state.availableWorkflow" :key="wf.id" :command="wf">
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
    <ElTabs v-if="state.formDialogVisible" v-model="activeName" v-loading="state.loading" @tab-change="tabChangeHandler">
      <ElTabPane v-loading="state.loading" :label="$t('workflow_form')" name="Form">
        <WorkflowDetailFormRender ref="vFormRef" />
      </ElTabPane>
      <ElTabPane :label="$t('workflow_graph')" name="Graph">
        <div v-if="openWorkflowEdit" class="pageContainer">
          <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="state.selectedWorkflow" :readonly="true" :show-actions="true" />
        </div>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <el-button
        v-if="!pageButtonSetting || pageButtonSetting.showSumBitButton"
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

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { newClientApi } from 'api'

const vFormRef = ref()
const workflowEditorRef = ref()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)
const graphEl = ref()
const emits = defineEmits(['created'])
const activeName = ref('Form')
const state = reactive({
  availableWorkflow: [],
  formDialogVisible: false,
  selectedWorkflow: {},
  bpmnXml: null,
  loading: false
})
type AdditionalButton = {
  props: any
  component: string
}
const additionalButton = ref<AdditionalButton[]>([])
const pageButtonSetting = ref<any>(null)
const openWorkflowEdit = ref(false)

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
  state.availableWorkflow = await $api.get(`http://192.168.5.147:8080/api/v1/workflow/definitions?published=true`).then((r) => r.data)
}

async function workflowClickHandler(item: any) {
  state.loading = true
  openWorkflowEdit.value = false
  const data = await $api.get(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${item.id}`).then((r) => r.data)
  if (!data) return
  if (data.status === 'D') {
    state.loading = false
    routerProvider?.message.error('Workflow has not been released.')
    return
  }

  openWorkflowEdit.value = true
  console.log(123, data.content)
  // Workflow未發佈
  if (Object.keys(data.content).length === 0) {
    state.loading = false
    routerProvider?.message.error('Workflow has not been released.')
    return
  }

  const startTask = data.content.nodes.find((item: any) => item.id === 'system_start_event')
  if (!startTask) {
    state.loading = false
    routerProvider?.message.error('缺少Start Task')
    return
  }

  state.selectedWorkflow = deepCopy(data)
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
  const { buttons, components, signatureSetting, buttonSetting } = await getBpmnAdditionalElement(metadata)
  additionalButton.value = buttons
  if (buttonSetting) {
    pageButtonSetting.value = buttonSetting
  }
}

async function checkAndSubmit() {
  state.loading = true
  const formData = await vFormRef.value.getFormData()
  const userId = useUserId()

  console.log(222, formData)
  if (!!formData) {
    const formParams = {
      start_user_id: userId.value,
      definition_id: state.selectedWorkflow.id,
      variables: {
        ...formData
      }
    }

    try {
      const data = await $api.post('http://192.168.5.147:8080/api/v1/processes', formParams).then((r) => r.data)
      console.log(333, data)
      state.formDialogVisible = false
      ElMessage.success('Workflow created')
      emits('created')
    } catch (e) {
      console.log(e)
    }
  }
  state.loading = false
}

onMounted(() => {
  getAvailableWorkflow()
})
defineExpose({ workflowClickHandler })
</script>
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
