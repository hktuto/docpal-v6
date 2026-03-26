<script setup lang="ts">
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

const props = defineProps<{
  id: string
}>()
const { t } = useI18n()
const openWorkflowEdit = ref(false)
const workflowData = ref()
const workflowReadonly = ref(false)
const workflowId = ref()
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
    workflowId.value = data.id
    workflowData.value = data.draft_content
    workflowReadonly.value = data.status !== 'D'

    nextTick(() => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
  }
}

async function handleStatus() {
  try {
    if (workflowReadonly.value) {
      await $api.put(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${workflowId.value}/deactivate`).then((r) => r.data)
      workflowReadonly.value = false
      openWorkflowEdit.value = false
      openWorkflowEdit.value = true
    } else {
      const userId = useUserId()
      await $api
        .put(`http://192.168.5.147:8080/api/v1/workflow/definitions/instance/${workflowId.value}/activate`, { user_id: userId.value })
        .then((r) => r.data)
      workflowReadonly.value = true
      openWorkflowEdit.value = false
      openWorkflowEdit.value = true
    }
  } catch (e) {
    console.log(e)
  }
}

onMounted(async () => {
  await getWorkflowData()
})
</script>

<template>
  <div v-if="openWorkflowEdit" class="pageContainer">
    <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" :show-actions="true">
      <template #actions>
        <el-button :type="workflowReadonly ? 'danger' : 'primary'" @click="handleStatus">
          {{ workflowReadonly ? t('actions.inactivate') : t('actions.activate') }}
        </el-button>
      </template>
    </LazyWorkflowEditor>
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
