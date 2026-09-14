<script lang="ts" setup>
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw new Error('graph provider not found')
}
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const oldHistory = ref('')

function setupHistory() {
  graphProvider?.graph.value?.on('history:change', (args: any) => {
    const appPlatform = useAppPlatform()
    if (appPlatform.value !== 'admin') return

    // 更新頁面樣式時不調用更新接口
    const cmdItem = args.cmds[0]
    if (!!cmdItem && cmdItem.event === 'cell:change:attrs') return
    // 連綫Node時防止頻繁調用'history:change'
    const newHistory = JSON.stringify({
      id: cmdItem.data.id,
      event: cmdItem.event,
      next: cmdItem.data.next,
      prev: cmdItem.data.prev
    })
    if (newHistory === oldHistory.value) return
    oldHistory.value = newHistory

    state.value.canUndo = graphProvider?.graph.value?.canUndo() || false
    state.value.canRedo = graphProvider?.graph.value?.canRedo() || false

    graphProvider?.updateStatus()
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
