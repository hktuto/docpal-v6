<script lang="ts" setup>
import { x6NodeToWorkflowJson } from '#imports'
import { clientApi } from 'api'
import { useDebounceFn } from '@vueuse/core'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw new Error('graph provider not found')
}
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const { workflowId, isActivate } = defineProps<{
  workflowId: string
  isActivate: boolean
}>()
const emits = defineEmits(['updateActivate'])

const debouncedSave = useDebounceFn(save, 300)
async function save() {
  const workflowJson = x6NodeToWorkflowJson(graphProvider)

  if (!workflowId || workflowId === '') {
    throw new Error('Workflow ID is null')
  }
  // 修改時，檢查是否已激活
  if (isActivate) {
    await clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId}/deactivate`).then((r: any) => r.data)
    emits('updateActivate')
  }

  // update workflow Json Data
  try {
    clientApi.instance.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId}`, workflowJson).then((r: any) => r.data)
  } catch (e) {
    routerProvider?.message.error(e)
    console.log(e)
  }
  graphProvider?.updateWorkflowJson(workflowJson)
}

function setupHistory() {
  graphProvider?.graph.value?.on('history:change', (args: any) => {
    // 更新頁面樣式時不調用更新接口
    const cmdItem = args.cmds[args.cmds.length - 1]
    if (!!cmdItem && cmdItem.event === 'cell:change:attrs') {
      return
    }
    const appPlatform = useAppPlatform()
    if (appPlatform.value !== 'admin') return

    state.value.canUndo = graphProvider?.graph.value?.canUndo() || false
    state.value.canRedo = graphProvider?.graph.value?.canRedo() || false

    // check if workflow is empty
    if (!graphProvider?.graph.value?.getNodes() && graphProvider?.graph.value?.getNodes().length === 0) return

    debouncedSave()
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
