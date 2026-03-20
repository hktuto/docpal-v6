<script lang="ts" setup>
import { useBatchDetail, useScanClient, statusToGroupStatus } from '#imports'
import { clientApi } from 'api'

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
  sectionsWithValues,
  projectId,
  reload,
  isLockedByOther,
} = useBatchDetail(props.batchId)



// Get permission helpers
const { isAdmin, isExporter, isVerifier } = useScanClient()
const canVerify = computed(() => isVerifier(projectId.value))
const isReadonly = computed(() => isLockedByOther.value || !canVerify.value || selectedDocDetail.value.detail.status === 'completed' )

// Loading state for document selection
const selectingDoc = ref(false)

// Check if batch is in processing status (cannot be opened)
const isBatchProcessing = computed(() => {
  const batchStatus = batchDetail.value?.status
  if (!batchStatus) return false
  const groupStatus = statusToGroupStatus(batchStatus)
  return groupStatus?.key?.includes('processing') || false
})

/**
 * Check if user can cancel this batch
 * Requires: admin permission for the batch's project
 * AND status must allow cancel (not cancelled or completed)
 */
const canCancel = computed(() => {
  const gorupStatus = statusToGroupStatus(batchDetail.value?.status)
  const canCancelStatus = !gorupStatus || (!gorupStatus.key.includes('cancelled') && !gorupStatus.key.includes('completed'))
  const hasAdminPermission = isAdmin(projectId.value)
  return canCancelStatus && hasAdminPermission
})

/**
 * Check if user can download/export this batch
 * Requires: exporter permission for the batch's project
 * AND status must be completed
 */
const canDownload = computed(() => {
  const hasExportPermission = isExporter(projectId.value)
  const hasExportableStatus = batchDetail.value?.status === 'completed'
  return hasExportPermission && hasExportableStatus
})

/**
 * Check if user can confirm this batch
 * Requires: verifier permission for the batch's project
 * AND all documents must be verified (status === 'completed')
 */
const canConfirm = computed(() => {
  const hasVerifierPermission = isVerifier(projectId.value)
  const allDocsCompleted = batchDetail.value?.documents?.every((doc: any) => doc.status === 'verified')
  return hasVerifierPermission && allDocsCompleted
})

function backToList() {
  const tab = createBatchListPageTab()
  routerProvider?.navigateTo(tab)
}

/**
 * Handle document selection with processing status check
 * If document is in "processing" status, fetch latest status first
 * Only select if status is not "processing"
 */
async function handleDocSelect(doc: any) {
  // If already selecting, prevent concurrent clicks
  if (selectingDoc.value) return

  // If document is not in processing status, select immediately
  if (doc.status !== 'processing') {
    currentSelectedDoc.value = doc
    return
  }

  // Document is in processing status, need to check latest status
  selectingDoc.value = true
  try {
    // Fetch latest document detail
    const response = await clientApi.api.getCaptureBatchBatchidDocDocidDetail(
      props.batchId,
      doc.id
    )

    const latestDoc = response.data

    // If still processing, don't select and show message
    if (latestDoc.status === 'processing') {
      routerProvider?.message.info('Document is still processing, please wait...')
      return
    }

    // Status has changed, update local documents list
    const docIndex = batchDetail.value?.documents?.findIndex((d: any) => d.id === doc.id)
    if (docIndex !== -1 && batchDetail.value?.documents) {
      batchDetail.value.documents[docIndex] = { ...batchDetail.value.documents[docIndex], ...latestDoc }
    }

    // Select the document
    currentSelectedDoc.value = batchDetail.value?.documents?.[docIndex] || latestDoc
  } catch (error) {
    console.error('Failed to fetch document detail:', error)
    routerProvider?.message.error('Failed to check document status')
  } finally {
    selectingDoc.value = false
  }
}

async function confirmBatch(){
  await clientApi.api.postCaptureBatchBatchidConfirm(batchDetail.value.id)
  routerProvider?.message.success('Batch confirmed successfully')
  backToList()
}
async function cancelBatch(){
  detailLoading.value = true
  const batchIds = [batchDetail.value.id]
  await clientApi.api.postCaptureBatchCancel({ batchIds })
  routerProvider?.message.success('Batch cancelled successfully')
  reload()
  detailLoading.value = false
}

async function downloadBatch(){
  detailLoading.value = true
  const batchIdList = [batchDetail.value.id]
  const token = localStorage.getItem('access_token')

  await fetch('/api/capture/export/zip',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ batchIdList }),
  }).then(async(res) => {
    const fileName = res.headers.get('content-disposition')?.split('filename=')[1]
    if (!fileName) return
    const b = await res.blob()
    const blob = new Blob([b], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.replaceAll('"', '')
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  })
  detailLoading.value = false
}

watch(() => props.batchId, (newBatchId) => {
  currentBatchId.value = newBatchId
})

// Watch for batch detail loading completion to check processing status
watch(detailLoading, (isLoading) => {
  if (!isLoading && batchDetail.value) {
    // Check if batch is in processing status
    if (isBatchProcessing.value) {
      routerProvider?.message.warning('Batch is still processing, please wait...')
      // Navigate back to list after a short delay
      backToList()
    }
  }
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
        <ElButton v-if="isAdmin(projectId)" :disabled="!canCancel" type="warning" @click="cancelBatch">Cancel Batch</ElButton>
        <ElButton v-if="isExporter(projectId)" :disabled="!canDownload" type="primary" @click="downloadBatch">Download Results</ElButton>
        <ElButton v-if="isVerifier(projectId)" :disabled="!canConfirm" type="primary" @click="confirmBatch">Confirm Batch</ElButton>
      </div>
    </div>

    <!-- Show message if batch is processing -->
    <div v-if="isBatchProcessing" class="processingState">
      <Icon name="lucide:loader-2" class="processingIcon" />
      <span class="processingText">Batch is processing...</span>
      <ElButton @click="backToList">Back to List</ElButton>
    </div>

    <!-- Normal batch detail view -->
    <ElSplitter v-else>
      <ElSplitterPanel size="200px" min="120">
        <div v-if="currentSelectedDoc" v-loading="selectingDoc" class="fileList">
          <ScanBatchDetailFileItem
            v-for="doc in batchDetail.documents"
            :key="doc.id"
            :doc="doc"
            :selected="doc.id === currentSelectedDoc.id"
            @click="handleDocSelect(doc)"
          />
        </div>
      </ElSplitterPanel>

      <ElSplitterPanel>
        <ScanBatchDetailFilePreview
          v-if="selectedDocDetail"
          :isReadonly="isReadonly"
        />
      </ElSplitterPanel>

      <ElSplitterPanel size="400px" min="200">
        <ScanBatchDetailFormDetail
          v-if="selectedDocDetail"
          :isReadonly="isReadonly"
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

.processingState {
  flex: 1;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);
}

.processingIcon {
  font-size: 48px;
  color: var(--app-primary-color);
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.processingText {
  font-size: var(--app-font-size-l);
}
</style>
