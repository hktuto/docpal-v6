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
const showRelease = ref(false)
const releaseContent = ref()
const workflowReadonly = ref(false)
const workflowId = ref()
const workflowEditorRef = ref()
const loading = ref(false)

async function getWorkflowData() {
  try {
    openWorkflowEdit.value = false
    if (!props.id) {
      throw new Error('Workflow ID is null')
    }
    openWorkflowEdit.value = true
    const data = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${props.id}`).then((r) => r.data)
    if (!data) {
      throw Error('workflow Data is null')
    }
    workflowId.value = data.id
    workflowData.value = data.draft_content
    workflowReadonly.value = false

    showRelease.value = !(!data.content || data.content === '')
    releaseContent.value = data.content

    nextTick(async () => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
  }
}

async function handleStatus() {
  loading.value = true
  try {
    if (workflowReadonly.value) {
      await $api.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/deactivate`).then((r: any) => r.data)
      workflowReadonly.value = false
      openWorkflowEdit.value = false
      openWorkflowEdit.value = true
    } else {
      const userId = useUserId()
      await $api.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/activate`, { user_id: userId.value }).then((r: any) => r.data)
      workflowReadonly.value = true
      openWorkflowEdit.value = false
      openWorkflowEdit.value = true
    }
    loading.value = false
  } catch (e) {
    loading.value = false
    console.log(e)
  }
}

function handleOpenRelease() {
  loading.value = true
  workflowData.value = workflowReadonly.value = true



  loading.value = false
}

onMounted(async () => {
  await getWorkflowData()
})
</script>

<template>
  <div v-if="openWorkflowEdit" v-loading="loading" class="pageContainer">
    <LazyWorkflowEditor ref="workflowEditorRef" :workflow-data="workflowData" :readonly="workflowReadonly" :showSidebar="true">
      <template #actions>
        <!--        <el-button id="Workflow__Edit__ActivateOrInactivate" :type="workflowReadonly ? 'danger' : 'primary'" @click="handleStatus">-->
        <!--          {{ workflowReadonly ? t('actions.inactivate') : t('actions.activate') }}-->
        <!--        </el-button>-->
        <el-button v-if="showRelease" type="primary" @click="handleOpenRelease">
          {{ $t('Open The Release Version') }}
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
