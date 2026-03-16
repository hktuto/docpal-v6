<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  id: string
}>()

const loading = ref(true)
const workflowData = ref()
const workflowReadonly = ref(false)

async function getWorkflowData() {
  loading.value = true
  if (!props.id) {
    throw new Error('Workflow ID is null')
  }
  try {
    const data = await $api.get(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${props.id}`).then((r) => r.data)
    if (!data) {
      throw Error('workflow Data is null')
    }
    workflowData.value = data.draft_content
    workflowReadonly.value = data.status !== 'D'
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

onMounted( async () => {
  await getWorkflowData()
})
</script>

<template>
  <div style="height: 500px">
    <div v-loading="loading" class="pageContainer">
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
