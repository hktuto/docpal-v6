<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'

const { node } = defineProps<{
  node: Node
}>()

const emits = defineEmits(['openForm'])
const formDialogRef = ref()
const formRenderVisible = ref()

// #region setup
const graphProvider = inject(WORKFLOW_PROVIDER)
const editorProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('provider not found')
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}
// #endregion

const drag = ref(false)
const formItems = ref<any[]>([])
const RuleManageDialogRef = ref()

function formChange() {
  console.log('form change', formItems.value)
  graphProvider?.graph.value?.startBatch('update-from-data')
  const newData = {
    ...node.data,
    version: (node.data.version || 0) + 1,
    data: {
      ...JSON.parse(JSON.stringify(node.data.data)),
      extensionElements: {
        ...node.data.data.extensionElements,
        'flowable:formProperty': JSON.parse(JSON.stringify(formItems.value))
      }
    }
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-from-data')
}

function refreshData() {}

function editField() {
  RuleManageDialogRef.value.open()
}

async function copyFormAndFieldSetting() {
  const fields = JSON.parse(JSON.stringify(formItems.value))
  const form = await editorProvider?.getFormByNode(node)
  console.log('copyFormAndFieldSetting', fields, form)
  editorProvider?.copyForm(node, {
    fields,
    form
  })
}

async function pasteForm() {
  await editorProvider?.pasteForm(node)
  refreshData()
}

function handleOpenForm() {
  formDialogRef.value.openDialog(node)
}

async function previewForm() {
  const id = node.data.id
  // TODO: 接口需要更換
  const response = await newAdminApi.getDmsFormPropertiesQuery({
    processKey: props.processKey,
    userTaskId: id,
    versionId: props.currentVersionId
  })
  if (!response || !response.data) {
    throw createError('Server Error')
  }
  if (response.data.length == 0 || !response.data[0].jsonValue || response.data[0].jsonValue === '{}') {
    ElMessage.warning('Empty Form')
    return
  }
  selectedStep.value = node.getData()
  formRenderVisible.value = true
  nextTick(() => {
    if (!response || !response.data) return
    if (response?.data.length > 0) {
      const json = JSON.parse(response.data[0].jsonValue || '{}')
      fromRenderRef.value.setForm(json)
    } else {
      fromRenderRef.value.setForm({})
    }
  })
}

onMounted(() => {
  setUpListener()
})
watch(
  () => node,
  () => {
    if (node) {
      // refreshData()
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
      <ElButton type="primary" id="Workflow__UserTask__EditField" :disabled="editorProvider.readonly.value" @click="editField">Edit Field</ElButton>
      <ElButton type="primary" id="Workflow__UserTask__EditForm" @click="handleOpenForm">Edit Form</ElButton>
      <ElButton type="primary" id="Workflow__UserTask__PreviewForm" @click="previewForm">Preview Form</ElButton>
    </div>

    <div class="actionsContainer">
      <ElButton type="link" size="small" @click="copyFormAndFieldSetting" :disabled="editorProvider.readonly.value">Copy Form and Field setting</ElButton>
      <ElButton v-if="editorProvider.copyKey.value" type="link" size="small" :disabled="editorProvider.readonly.value" @click="pasteForm">
        Paste Form
      </ElButton>
    </div>
  </div>

  <LazyContextVariableManageDialog ref="RuleManageDialogRef" />
  <LazyContextFormDialog ref="formDialogRef" />
  <ElDialog v-model="formRenderVisible" class="big" distory-on-close draggable>
    <LazyContextFormRender ref="fromRenderRef" />
  </ElDialog>
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
