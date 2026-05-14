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
const isActivate = ref(false)
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
    const data: any = await $api.get(`/oniflow/api/v1/workflow/definitions/instance/${props.id}`).then((r: any) => r.data.data)
    if (!data) return

    workflowId.value = data.id
    workflowData.value = data.draft_content
    workflowReadonly.value = false
    isActivate.value = !(data.version > data.published_version)
    showRelease.value = !(!data.content || data.content === '')
    releaseContent.value = data.content

    nextTick(async () => {
      workflowEditorRef.value?.init()
    })
  } catch (e) {
    console.log(e)
    throw new Error(e)
  }
}

async function handleStatus() {
  loading.value = true
  try {
    const userId = useUserId()
    await $api.put(`/oniflow/api/v1/workflow/definitions/instance/${workflowId.value}/activate`, { user_id: userId.value }).then((r: any) => r.data)
    openWorkflowEdit.value = false
    openWorkflowEdit.value = true
    isActivate.value = true
    loading.value = false
  } catch (e) {
    loading.value = false
    console.log(e)
  }
}

function handleUpdateActivate() {
  isActivate.value = false
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
    <WorkflowEditor
      ref="workflowEditorRef"
      :workflow-data="workflowData"
      :readonly="workflowReadonly"
      :showSidebar="true"
      :is-activate="isActivate"
      @updateActivate="handleUpdateActivate"
    >
      <template #actions>
        <el-button v-if="!isActivate" id="Workflow__Edit__ActivateOrInactivate" type="primary" @click="handleStatus">
          {{ $t('actions.activate') }}
        </el-button>
        <!--        <el-button v-if="showRelease" type="primary" @click="handleOpenRelease">-->
        <!--          {{ $t('Open The Release Version') }}-->
        <!--        </el-button>-->
      </template>
    </WorkflowEditor>
  </div>
</template>

<style scoped lang="scss">
.pageContainer {
  width: 100%;
  height: 100%;
}
</style>
