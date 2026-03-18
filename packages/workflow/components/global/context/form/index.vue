<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'
import { useWorkflowAdditionalContext } from '#imports'

const { node } = defineProps<{
  node: Node
}>()

const emits = defineEmits(['openForm'])
const formDialogRef = ref()
const formRenderVisible = ref()
const fromRenderRef = ref()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { workflowKey } = graphProvider

const formItems = ref<any[]>([])
const RuleManageDialogRef = ref()

const formKey = ref<number>(0)

function refreshData() {
  const data = node.getData()
  formKey.value = Number(data.metadata.formKey)
}

function editField() {
  RuleManageDialogRef.value.open()
}

async function copyFormAndFieldSetting() {
  const fields = JSON.parse(JSON.stringify(formItems.value))
  const form = await graphProvider?.getFormByNode(node)
  console.log('copyFormAndFieldSetting', fields, form)
  graphProvider?.copyForm(node, {
    fields,
    form
  })
}

async function pasteForm() {
  await graphProvider?.pasteForm(node)
  refreshData()
}

async function handleOpenForm() {
  const formJson = await getFormJson()
  formDialogRef.value.openDialog(formJson)
}

function handelSubmitForm(id: string) {
  graphProvider?.graph.value?.startBatch('update-fromKey-data')
  const data = node.getData()
  const newData = {
    ...data,
    metadata: {
      ...data.metadata,
      formKey: id
    }
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-fromKey-data')
}

async function previewForm() {
  const json = await getFormJson()
  formRenderVisible.value = true
  nextTick(() => {
    fromRenderRef.value.setForm(json)
  })
}

async function getFormJson() {
  const id = node.data.id
  const data = await newAdminApi.getDmsFormPropertiesQuery({ userTaskId: id }).then((r) => r.data)
  if (!data) {
    throw createError('Server Error')
  }

  if (data.length == 0 || !data[0].jsonValue) {
    ElMessage.warning('Empty Form')
    return {}
  }

  if (formKey.value != 0) {
    const find = data.find((item: any) => item.id === formKey.value)
    if (!find) return {}
    return find.jsonValue
  } else {
    return {}
  }
}

onMounted(() => {
  useWorkflowAdditionalContext(refreshData)
})

watch(
  () => node,
  () => {
    if (node) {
      refreshData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="formComponentContainer">
    <div class="title">{{ $t('workflowEdior.formField') }}</div>
    <div class="actionsContainer">
      <ElButton type="primary" id="Workflow__UserTask__EditField" :disabled="graphProvider.readonly.value" @click="editField">Edit Field</ElButton>
      <ElButton type="primary" id="Workflow__UserTask__EditForm" @click="handleOpenForm">Edit Form</ElButton>
      <ElButton type="primary" id="Workflow__UserTask__PreviewForm" @click="previewForm">Preview Form</ElButton>
    </div>

    <div class="actionsContainer">
      <ElButton size="small" @click="copyFormAndFieldSetting" :disabled="graphProvider.readonly.value">Copy Form and Field setting</ElButton>
      <ElButton v-if="graphProvider.copyKey.value" size="small" :disabled="graphProvider.readonly.value" @click="pasteForm"> Paste Form </ElButton>
    </div>
  </div>

  <LazyContextVariableManageDialog ref="RuleManageDialogRef" :node="node" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :processKey="workflowKey" @submit="handelSubmitForm" />
  <el-dialog v-model="formRenderVisible" class="big" distory-on-close draggable>
    <LazyContextFormRender ref="fromRenderRef" />
  </el-dialog>
</template>

<style lang="scss" scoped>
.actions {
  cursor: pointer;
}

.mover {
  cursor: move;
}

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

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
