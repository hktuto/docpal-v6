<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  id: string
}>()

const openWorkflowEdit = ref(false)
const workflowData = ref()
const workflowReadonly = ref(false)
const workflowEditorRef = ref()

async function getWorkflowData() {
  openWorkflowEdit.value = false
  if (!props.id) {
    throw new Error('Workflow ID is null')
  }
  try {
    openWorkflowEdit.value = true
    const data = await $api.get(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${props.id}`).then((r) => r.data)
    if (!data) {
      throw Error('workflow Data is null')
    }
    workflowData.value = data.draft_content
    workflowReadonly.value = data.status !== 'D'

    nextTick(() => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
  }
}

onMounted(async () => {
  await getWorkflowData()
})
</script>

<template>
  <div style="height: 500px">
    <div v-if="openWorkflowEdit" class="pageContainer">
      <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
