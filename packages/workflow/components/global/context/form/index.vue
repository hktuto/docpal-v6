<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { newClientApi } from 'api'
import { useWorkflowAdditionalContext } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()
const emits = defineEmits(['openForm'])
const formDialogRef = ref()
const formRenderVisible = ref()
const fromRenderRef = ref()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const { workflowKey } = graphProvider
const formTitle = ref<string>('')
const formItems = ref<any[]>([])
const RuleManageDialogRef = ref()

const formKey = ref<string>('')

function initData() {
  const data = node.getData()
  formKey.value = data.config.human_task.form_key
  formTitle.value = data.metadata.form_title || ''
}

function editField() {
  RuleManageDialogRef.value.open()
}

async function copyFormAndFieldSetting() {
  const fields = JSON.parse(JSON.stringify(formItems.value))
  const form = await graphProvider?.getFormByNode(node)
  graphProvider?.copyForm(node, {
    fields,
    form
  })
}

function pasteForm() {
  graphProvider?.pasteForm(node)
  initData()
}

async function handleOpenForm() {
  const formJson = await getFormJson()
  formDialogRef.value.openDialog(formJson)
}

function update() {
  graphProvider?.graph.value?.startBatch('update-form-setting-data')
  const data = node.getData()
  const newData = {
    ...data,
    config: {
      ...data.config,
      human_task: {
        ...data.config.human_task,
        form_title: formTitle.value
      }
    },
    version: (data.version || 0) + 1
  }
  if (!!formKey.value && formKey.value !== '') {
    newData.config.human_task.form_key = formKey.value.toString()
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-form-setting-data')
}

function handelSubmitForm(id: string) {
  formKey.value = id
  update()
}

async function previewForm() {
  const json = await getFormJson()
  formRenderVisible.value = true
  nextTick(() => {
    fromRenderRef.value.setForm(json)
  })
}

async function getFormJson() {
  try {
    if (!!formKey.value && formKey.value !== 0) {
      const data: any = await newClientApi.getDmsFormPropertiesId(formKey.value).then((r) => r.data)
      if (!data) return {}

      return data.jsonValue
    } else {
      return {}
    }
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  useWorkflowAdditionalContext(initData)
})

watch(
  () => node,
  () => {
    if (node) {
      initData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top" :disabled="graphProvider.readonly.value">
    <div class="title">{{ $t('Form Setting') }}</div>
    <el-form-item :label="t('Form Title')">
      <el-input v-model="formTitle" @change="update" />
    </el-form-item>
    <div class="actionsContainer">
      <el-button type="primary" id="Workflow__UserTask__EditField" @click="editField">Edit Field</el-button>
      <el-button type="primary" id="Workflow__UserTask__EditForm" @click="handleOpenForm">Edit Form</el-button>
      <el-button type="primary" id="Workflow__UserTask__PreviewForm" @click="previewForm">Preview Form</el-button>
    </div>
    <div class="actionsContainer">
      <el-button size="small" @click="copyFormAndFieldSetting">Copy Form and Field setting</el-button>
      <el-button v-if="graphProvider.copyKey.value" size="small" @click="pasteForm">Paste Form</el-button>
    </div>
  </el-form>

  <LazyContextVariableManageDialog ref="RuleManageDialogRef" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :processKey="workflowKey" @submit="handelSubmitForm" />
  <el-dialog v-model="formRenderVisible" class="big" distory-on-close draggable append-to-body>
    <LazyContextFormRender ref="fromRenderRef" />
  </el-dialog>
</template>

<style lang="scss" scoped>
.actionsContainer {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  margin-block: var(--app-font-size-xs);
  gap: var(--app-space-xs);
  padding-block: var(--app-space-xs);
  border-top: 1px solid var(--app-grey-800);

  > * {
    width: 100%;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>
