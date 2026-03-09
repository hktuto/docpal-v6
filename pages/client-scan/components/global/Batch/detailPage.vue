<script lang="ts" setup>
import { useBatchDetail } from '#imports'

const props = defineProps<{
  batchId: string
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

// Use the composable for all batch detail state
const {
  detailLoading, 
  batchDetail, 
  currentBatchId,
  currentSelectedDoc,
  selectedDocDetail,
  sectionsWithValues
} = useBatchDetail(props.batchId)

const canCancel = computed(() => {
  return batchDetail.value?.status === 'pending'
})

const canDownload = computed(() => {
  return batchDetail.value?.status === 'completed'
})

const canConfirm = computed(() => {
  return batchDetail.value?.documents?.every((doc: any) => doc.status === 'completed')
})

function backToList() {
  const tab = createBatchListPageTab()
  routerProvider?.navigateTo(tab)
}

watch(() => props.batchId, (newBatchId) => {
  currentBatchId.value = newBatchId
})
</script>

<template>
  <div v-loading="detailLoading" class="pageContainer">
    <div class="topbar">
      <div class="back" @click="backToList">
        <Icon name="material-symbols:arrow-back-ios" />
      </div>
      <div class="title">
        {{ batchDetail?.batchNo }}
      </div>
      <div class="actions">
        <ElButton :disabled="!canCancel" type="warning">Cancel Batch</ElButton>
        <ElButton :disabled="!canDownload" type="primary">Download Results</ElButton>
        <ElButton :disabled="!canConfirm" type="primary">Confirm Batch</ElButton>
      </div>
    </div>

    <ElSplitter>
      <ElSplitterPanel size="200px" min="120">
        <div v-if="currentSelectedDoc" class="fileList">
          <ScanBatchDetailFileItem
            v-for="doc in batchDetail.documents"
            :key="doc.id"
            :doc="doc"
            :selected="doc.id === currentSelectedDoc.id"
            @click="currentSelectedDoc = doc"
          />
        </div>
      </ElSplitterPanel>

      <ElSplitterPanel>
        <ScanBatchDetailFilePreview
          v-if="selectedDocDetail"
        />
      </ElSplitterPanel>

      <ElSplitterPanel size="300px" min="200">
        <ScanBatchDetailFormDetail
          v-if="selectedDocDetail"
        />
      </ElSplitterPanel>
    </ElSplitter>
  </div>
</template>

<style lang="scss" scoped>
.back {
  cursor: pointer;
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

.fileList {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  padding: var(--app-space-s);
  height: 100%;
  overflow-y: auto;
}

.el-splitter {
  overflow: hidden;
}
</style>
