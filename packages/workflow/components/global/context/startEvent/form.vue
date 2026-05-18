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
const formDialogRef = ref()
const variableManageDialogRef = ref()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { workflowKey } = graphProvider
const formKey = ref<string>('')
const formJson = ref({})
const variables = computed(() => {
  const variableList = getVariablesByDisplayTypes()
  return {
    labelKey: 'name',
    nameKey: 'id',
    data: variableList.filter((item: VariableItem) => item.required && !item.id.startsWith('__system__'))
  }
})

function initData() {
  const data = node.getData()
  formKey.value = data.config.initialise.form_key
}

function update() {
  graphProvider?.graph.value?.startBatch('update-start-setting-data')
  const data = node.getData()
  const newData = {
    ...data,
    config: {
      ...data.config
    }
  }
  if (!!formKey.value && formKey.value !== '') {
    newData.config.initialise.form_key = formKey.value.toString()
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-start-setting-data')
}

function editField() {
  variableManageDialogRef.value.open()
}

async function editForm() {
  await getFormJson()
  formDialogRef.value.openDialog(formJson.value)
}

function handelSubmitForm(id: string) {
  formKey.value = id
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
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="actionsContainer">
    <el-button style="width: 100%" type="primary" id="Workflow__Start__EditField" @click="editField">
      {{ $t('Workflow Global Variables') }}
    </el-button>
    <el-button style="width: 100%" type="primary" id="Workflow__Start__EditForm" @click="editForm">
      {{ $t('Edit Start Form') }}
    </el-button>
  </div>

  <LazyContextVariableManageDialog ref="variableManageDialogRef" />
  <LazyContextFormDialog ref="formDialogRef" :node="node" :variables="variables" :processKey="workflowKey" @submit="handelSubmitForm" />
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
