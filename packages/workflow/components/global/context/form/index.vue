<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { newClientApi } from 'api'
import { useWorkflowAdditionalContext } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()
const emits = defineEmits(['openForm'])
const { variables, getVariablesByDisplayTypes } = useVariablesProvide()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { workflowKey } = graphProvider
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const formDialogRef = ref()
const formRenderVisible = ref<boolean>(false)
const fromRenderRef = ref()
const formTitle = ref<string>('')
const contextFormFieldManageDialogRef = ref()
const formKey = ref<string>('')
const formField = ref<any[]>([])
const formJson = ref({})
const variablesData = computed(() => {
  const variableList = getVariablesByDisplayTypes()
  return {
    labelKey: 'name',
    nameKey: 'id',
    data: variableList.filter((item) => !item.id.startsWith('__system__'))
  }
})

function initData() {
  const data = node.getData()
  const humanTask = data.config.human_task
  formKey.value = humanTask.form_key
  formTitle.value = humanTask.form_title || ''
  formField.value = humanTask.form_fields || []
}

function editField() {
  contextFormFieldManageDialogRef.value.open()
}

async function copyFormAndFieldSetting() {
  graphProvider?.copyForm(node, {
    config: node.getData().config,
    metadata: node.getData().metadata
  })
}

function pasteForm() {
  graphProvider?.pasteForm(node)
  initData()
}

async function handleOpenForm() {
  await getFormJson()
  formDialogRef.value.openDialog(formJson.value)
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
    newData.config.human_task.form_fields = formField.value
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-form-setting-data')
}

async function handelSubmitForm(formID: string) {
  formKey.value = formID
  updateFormField()
  update()
}

function updateFormField() {
  // formField 有資料：保留相同 id 的舊數據，其它用新數據
  const byId = new Map(formField.value.map((f: any) => [f.id, f]))
  formField.value = variables.value.filter((item: any) => !item.id.startsWith('__system__')).map((n: any) => byId.get(n.id) ?? n)
}

async function previewForm() {
  if (!formKey.value && formKey.value == '') {
    routerProvider?.message.error('Form not configured')
    return
  }

  await getFormJson()
  formRenderVisible.value = true
  setTimeout(() => {
    fromRenderRef.value.setForm(formJson.value)
  }, 100)
}

function handleUpdateFormField(field: any) {
  formField.value = formField.value.map((item: any) => {
    if (item.id === field.id) return { ...field }
    return item
  })
  update()
}

async function getFormJson() {
  formJson.value = {}
  try {
    if (!!formKey.value && formKey.value !== '') {
      const data: any = await newClientApi.getDmsFormPropertiesId(Number(formKey.value)).then((r) => r.data)
      if (!data) return {}
      formJson.value = data.jsonValue
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
      <el-button type="primary" id="Workflow__UserTask__EditField" @click="editField">Edit Form Field</el-button>
      <el-button type="primary" id="Workflow__UserTask__EditForm" @click="handleOpenForm">Edit Form</el-button>
      <el-button type="success" id="Workflow__UserTask__PreviewForm" @click="previewForm">Preview Form</el-button>
    </div>
    <div class="actionsContainer">
      <el-button size="small" @click="copyFormAndFieldSetting">Copy Form</el-button>
      <el-button v-if="graphProvider.copyKey.value" size="small" @click="pasteForm">Paste Form</el-button>
    </div>
  </el-form>

  <LazyContextFormFieldManageDialog ref="contextFormFieldManageDialogRef" :form-field="formField" @updateFormField="handleUpdateFormField" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :variables="variablesData" :processKey="workflowKey" :formKey="formKey" @submit="handelSubmitForm" />
  <el-dialog v-model="formRenderVisible" class="big" distory-on-close append-to-body>
    <div style="height: 800px">
      <LazyContextFormRender ref="fromRenderRef" />
    </div>
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
