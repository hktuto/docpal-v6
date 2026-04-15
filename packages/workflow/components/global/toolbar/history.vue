<script lang="ts" setup>
import { x6NodeToWorkflowJson } from '#imports'
import { newAdminApi } from 'api'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw new Error('graph provider not found')
}
const { workflowId, isActivate } = defineProps<{
  workflowId: string
  isActivate: boolean
}>()
const emits = defineEmits(['updateActivate'])

async function save() {
  const workflowJson = x6NodeToWorkflowJson(graphProvider)

  if (!workflowId || workflowId === '') {
    throw new Error('Workflow ID is null')
  }
  console.log(213)
  // 修改時，檢查是否已激活
  if (isActivate) {
    await $api.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId}/deactivate`).then((r: any) => r.data)
    emits('updateActivate')
  }

  // update workflow Json Data
  try {
    $api.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId}`, workflowJson).then((r: any) => r.data)
  } catch (e) {
    console.log(e)
  }
}

function setupHistory() {
  graphProvider?.graph.value?.on('history:change', () => {
    state.value.canUndo = graphProvider?.graph.value?.canUndo() || false
    state.value.canRedo = graphProvider?.graph.value?.canRedo() || false
    // check if workflow is empty
    if (graphProvider?.graph.value?.getNodes() && graphProvider?.graph.value?.getNodes().length > 0) {
      save()
    }
  })
}

function undo() {
  graphProvider?.graph.value?.undo()
}

function redo() {
  graphProvider?.graph.value?.redo()
}

const state = ref({
  canUndo: false,
  canRedo: false
})

onMounted(() => {
  setupHistory()
})
</script>

<template>
  <div :class="{ icon: true, disabled: !state.canUndo }">
    <Icon name="lucide:undo-dot" @click="undo" />
    <div class="label">Undo</div>
  </div>
  <div :class="{ icon: true, disabled: !state.canRedo }">
    <Icon name="lucide:redo-dot" @click="redo" />
    <div class="label">Redo</div>
  </div>
</template>

<style lang="scss" scoped></style>
