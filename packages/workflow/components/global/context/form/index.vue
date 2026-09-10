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
    newData.config.human_task.form_key = formKey.value
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
  // const byId = new Map(formField.value.map((f: any) => [f.id, f]))
  // formField.value = variables.value.filter((item: any) => !item.id.startsWith('__system__')).map((n: any) => byId.get(n.id) ?? n)

  // TODO: 存在array 與object 類型的值類型，因爲全局修改導致數據格式，user form 沒有同步修改（全部同步，後續需要使用上面的代碼，需要提供一個獨自同步單獨一個字段的數據格式的按鈕）
  formField.value = variables.value ?? []
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
    if (formKey.value !== '') {
      const data: any = await newClientApi.getDmsFormPropertiesId(formKey.value).then((r) => r.data)
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
    <div class="form-summary-card">
      <div class="form-summary-item">
        <span class="summary-label">{{ t('Form Title') }}</span>
        <strong class="summary-value">{{ formTitle || '-' }}</strong>
      </div>
      <div class="form-summary-item">
        <span class="summary-label">Form Key</span>
        <strong class="summary-value">{{ formKey || '-' }}</strong>
      </div>
    </div>
    <el-form-item :label="t('Form Title')">
      <el-input v-model="formTitle" @change="update" />
    </el-form-item>
    <div class="actionsContainer">
      <el-button type="primary" id="Workflow__UserTask__EditField" @click="editField">Edit Form Field</el-button>
      <el-button type="primary" id="Workflow__UserTask__EditForm" @click="handleOpenForm">Edit Form</el-button>
      <el-button v-if="formKey !== ''" type="success" id="Workflow__UserTask__PreviewForm" @click="previewForm">Preview Form</el-button>
    </div>
    <div class="secondaryActionsContainer">
      <el-button size="small" @click="copyFormAndFieldSetting">Copy Form</el-button>
      <el-button v-if="graphProvider.copyKey.value" size="small" @click="pasteForm">Paste Form</el-button>
    </div>
  </el-form>

  <LazyContextFormFieldManageDialog ref="contextFormFieldManageDialogRef" :form-field="formField" @update="handleUpdateFormField" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :variables="variablesData" :processKey="workflowKey" :formKey="formKey" @submit="handelSubmitForm" />
  <el-dialog v-model="formRenderVisible" class="big" distory-on-close append-to-body draggable>
    <div style="height: 800px">
      <LazyContextFormRender ref="fromRenderRef" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.title {
  margin-bottom: var(--app-space-s);
  font-size: 0.9375rem;
  font-weight: 700;
}

.form-summary-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-s);
}

.form-summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--app-space-s);
  border: 1px solid var(--app-grey-800, #dcdfe6);
  border-radius: var(--app-border-radius-m);
  background: var(--el-fill-color-lighter);
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actionsContainer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-block: var(--app-font-size-xs);
  gap: var(--app-space-xs);
  padding-block: var(--app-space-xs);
  border-top: 1px solid var(--app-grey-800);

  > * {
    min-width: 0;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.actionsContainer :deep(#Workflow__UserTask__PreviewForm) {
  grid-column: 1 / -1;
}

.secondaryActionsContainer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-xs);
  padding-top: var(--app-space-xs);
  border-top: 1px solid var(--app-grey-800);
}

.secondaryActionsContainer > * {
  min-width: 0;
}

@media (max-width: 640px) {
  .form-summary-card,
  .actionsContainer,
  .secondaryActionsContainer {
    grid-template-columns: 1fr;
  }

  .actionsContainer :deep(#Workflow__UserTask__PreviewForm) {
    grid-column: auto;
  }
}
</style>
