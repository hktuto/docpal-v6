<script setup lang="ts">
import type { Node } from '@antv/x6'
import { useWorkflowAdditionalContext } from '@packages/workflow/composables/useWorkflow'
import { newClientApi } from 'api'
import { type VariableItem } from '#imports'

const { getVariablesByDisplayTypes } = useVariablesProvide()
const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const formRenderVisible = ref<boolean>(false)
const fromRenderRef = ref()
const formDialogRef = ref()
const variableManageDialogRef = ref()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { workflowKey } = graphProvider
const loading = ref<boolean>(false)
const formKey = ref<string>('')
const formJson = ref({})
const variables = computed(() => {
  const variableList = getVariablesByDisplayTypes()
  return {
    labelKey: 'name',
    nameKey: 'id',
    data: variableList.filter((item: VariableItem) => !item.id.startsWith('__system__')) || []
  }
})
const isEdit = computed(() => {
  return !!formKey.value && formKey.value !== ''
})

function initData() {
  const data = node.getData()
  formKey.value = data.config.initialise.form_key
}

function update() {
  graphProvider?.graph.value?.startBatch('update-start-setting-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config
    },
    version: (nodeData.version || 0) + 1
  }
  newData.config.initialise.form_key = formKey.value.toString()

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-start-setting-data')
}

function editField() {
  variableManageDialogRef.value.open()
}

function createForm() {
  formDialogRef.value.openDialog({})
}

async function editForm() {
  loading.value = true
  await getFormJson()
  formDialogRef.value.openDialog(formJson.value)
  loading.value = false
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

function handelSubmitForm(id: string) {
  formKey.value = id
  update()
}

async function getFormJson() {
  formJson.value = {}
  try {
    const data: any = await newClientApi.getDmsFormPropertiesId(Number(formKey.value)).then((r) => r.data)
    if (!data) return {}
    formJson.value = data.jsonValue
  } catch (e) {
    console.log(e)
  }
}

function handleDeleteFormKey() {
  formKey.value = ''
  update()
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
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="actionsContainer">
    <el-button style="width: 100%" type="primary" id="Workflow__Start__EditField" @click="editField">
      {{ $t('Workflow Global Variables') }}
    </el-button>

    <el-button v-if="!isEdit" type="primary" style="width: 100%" @click="createForm">
      {{ $t('Create Start Form') }}
    </el-button>
    <template v-else>
      <el-button v-loading="loading" style="width: 100%" type="primary" id="Workflow__Start__EditForm" @click="editForm">
        {{ $t('Edit Start Form') }}
      </el-button>
      <el-button style="width: 100%" type="success" id="Workflow__Start__PreviewForm" @click="previewForm">
        {{ $t('Preview Form') }}
      </el-button>

      <el-popconfirm class="box-item" title="Are you sure you want to delete this form?" placement="top">
        <template #reference>
          <el-button type="danger" style="width: 100%; margin-top: 5px" @click="handleDeleteFormKey">{{ $t('Delete Start Form') }}</el-button>
        </template>
      </el-popconfirm>
    </template>
  </div>

  <LazyContextVariableManageDialog ref="variableManageDialogRef" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :variables="variables" :processKey="workflowKey" :formKey="formKey" @submit="handelSubmitForm" />
  <el-dialog v-model="formRenderVisible" class="big" distory-on-close append-to-body>
    <div style="height: 800px">
      <LazyContextFormRender ref="fromRenderRef" />
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
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
