<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  projectId: string
}>()
const { projectId } = toRefs(props)
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const projectDetail = ref()
const loading = ref(false)
async function getProjetDetail() {
  loading.value = true
  try {
    const res = await clientApi.api.getCaptureProjId(projectId.value)
    res.data.additionFieldsSetting = JSON.parse(res.data.additionFieldsSetting) || []
    projectDetail.value = res.data
  } catch (error) {
  } finally {
    loading.value = false
  }
}

function backToList() {
  const tab = createProjectTableTab()
  routerProvider?.navigateTo(tab)
}

watch(
  projectId,
  () => {
    getProjetDetail()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="pageContainer">
    <div class="topbar">
      <div class="back" @click="backToList">
        <Icon name="material-symbols:arrow-back-ios" />
      </div>
      <div class="title">
        {{ projectDetail?.name }} <ElTag>{{ projectDetail?.status === 'I' ? 'Draft' : 'Prodction' }}</ElTag>
      </div>
      <div class="actions">
        <ScanProjectPremissionDialog :projectId="projectId" />
        <ElButton type="primary">Export Project</ElButton>
        <ScanProjectDeleteButton :projectId="projectId" />
      </div>
    </div>
    <ElSplitter>
      <ElSplitterPanel size="200px" min="120" >
        <ScanProjectInfo :info="projectDetail" @updated="getProjetDetail" />
      </ElSplitterPanel>
      <ElSplitterPanel>
        <ScanProjectFormList :projectId="projectId" />
      </ElSplitterPanel>
      <ElSplitterPanel size="200px" min="120">
        <ScanProjectAuditList :projectId="projectId" />
      </ElSplitterPanel>
    </ElSplitter>
  </div>
</template>

<style lang="scss" scoped>
.back {
  cusor: pointer;
}
.pageContainer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;
}
.topbar {
  padding: var(--app-space-s);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid var(--app-border-color);
}

.title {
  flex: 1 0 auto;
}
</style>
