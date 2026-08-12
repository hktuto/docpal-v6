<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { newClientApi } from 'api'
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'
import { conversionFormDataByVariables, newWorkflowStartPage } from '#imports'
import { workflowResponseHelper } from '@packages/workflow/utils/jsonConversion'

const vFormRef = ref()
const routerProvider = inject(MenuRouterKey)
const isFullScreen = ref(false)
const state = reactive({
  formDialogVisible: false,
  selectedWorkflow: {
    id: '',
    name: ''
  },
  formVariables: [],
  loading: false
})
const emits = defineEmits(['reload'])
const userId = useUserId()
const workflowList = await getWorkflowList()

async function workflowClickHandler(workflowItem: any, isTrigger?: boolean = false, originalData?: any) {
  state.loading = true
  try {
    const data = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${workflowItem.id}`).then((r: any) => workflowResponseHelper(r))
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
      state.loading = false
      routerProvider?.message.error('Workflow No process')
      return
    }

    // Start Task has no set E-Form
    if (!startTask.config?.initialise?.form_key || startTask.config?.initialise?.form_key === '') {
      await directlyStart(data.id, originalData)
      state.loading = false
      return
    }

    if (startTask.config?.initialise?.form_fields?.length > 0) {
      state.formVariables = startTask.config?.initialise?.form_fields
    } else {
      state.formVariables = Object.entries(data.content.variables).map(([key, value]) => ({
        id: key,
        ...value
      })) as []
    }

    // Open in new page, 從DB啓動的workflow不允許跳轉至外部分頁編輯
    if (!isTrigger && startTask.metadata.openInNewPage) {
      state.loading = false
      const link = newWorkflowStartPage(data.name, data.id, startTask, state.formVariables)
      routerProvider?.navigateTo(link)
      return
    }

    state.formDialogVisible = true
    await initForm(startTask, originalData)
  } catch (e) {
    state.loading = false
    routerProvider?.message.error('Failed to start workflow.')
    console.log(e)
  }
}

async function directlyStart(definition_id: string, workflowData?: any) {
  try {
    const formParams = {
      start_user_id: userId.value,
      definition_id: definition_id,
      variables: {
        __system__user_creator_id: userId.value,
        ...workflowData
      }
    }
    await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => r.data.data)
  } catch (e) {
    console.log(e)
  }
}

async function initForm(taskNode: any, workflowData?: any) {
  const formKey = taskNode.config.initialise.form_key

  const formJson = await newClientApi.getDmsFormPropertiesId(formKey).then((r) => r.data)
  if (!formJson || !formJson.jsonValue) return {}
  state.loading = false
  // @ts-ignore
  nextTick(() => {
    vFormRef.value.setForm(formJson.jsonValue, workflowData)
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
      const data = await $api.post('/oniflow/api/v1/processes', formParams).then((r: any) => workflowResponseHelper(r))

      setTimeout(async () => {
        // Check workflow running status
        const newVar = await $api.get(`/oniflow/api/v1/processes/instance/${data.process_id}`).then((r: any) => workflowResponseHelper(r))
        if (newVar.state === 'running') {
          routerProvider?.message.success('Workflow created')
        }
      }, 100)
    } catch (e) {
      routerProvider?.message.error('Failed to start workflow, please contact the administrator! ')
      console.log(e)
    } finally {
      state.formDialogVisible = false
    }
  }
  state.loading = false
  emits('reload')
}

defineExpose({ workflowClickHandler })

const newWorkflowTask = useNewWorkflowTask()
watch(newWorkflowTask, async (item) => {
  if (!item?.id) return
  const { id, data } = item
  newWorkflowTask.value = null
  await workflowClickHandler({ id }, true, data)
})
</script>

<template>
  <el-dropdown id="Workflow__NewWorkflow" popper-class="popover-auto" trigger="click" @command="(value: any) => workflowClickHandler(value, false, null)">
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
    <template v-if="state.formDialogVisible" v-loading="state.loading">
      <ContextFormRender ref="vFormRef" />
    </template>

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
