<template>
  <ElDrawer v-model="drawerOpen" :title="$t('upload.upload')" :with-header="true" :size="300" :show-close="true" class="uploadStructureDrawer" :modal="false">
    <el-collapse v-model="activeNames">
      <el-collapse-item v-for="(item, index) in uploadState.uploadRequestList" :key="item.id" :name="index.toString()">
        <template #title>
          <div :title="getRequestTitle(item)">
            <div style="padding: unset; margin: unset; line-height: 28px; height: 28px">
              {{ formatDate(item.startDate) }}
            </div>
            <el-progress
              class="ai-upload-progress"
              :percentage="getPercentage(item.finishCount, item.docList.length)"
              :stroke-width="6"
              :show-text="false"
              :striped="!item.aiFinish && isAIFeature()"
              :striped-flow="!item.aiFinish"
            />
          </div>
        </template>
        <el-divider />
        <el-button v-show="item.finishCount === item.docList.length" type="info" size="small" @click="exportCsv(item.docList)">{{
          $t('title.ExportCsvFile')
        }}</el-button>
        <div class="listContainer">
          <div v-for="uploadItem in item.docList" :key="uploadItem.id" class="uploadItem">
            <div class="nameContainer" @click="itemClickHandler(uploadItem)">
              <el-button v-if="uploadItem.status === 'success'" type="success" :icon="Check" text></el-button>
              <el-button v-else-if="uploadItem.status === 'loading'" loading text></el-button>
              <el-button v-else :icon="Close" type="danger" text></el-button>
              <BrowseItemIcon class="el-icon--left" :type="uploadItem.isFolder ? 'folder' : 'file'" :fileName="uploadItem.name" />
              <span> {{ uploadItem.name }} </span>
            </div>
            <div v-if="uploadItem.status === 'exception'" class="uploadStatus-exception">
              {{ uploadItem.status }}
            </div>
            <div v-else-if="!uploadItem.isFolder && uploadItem.status !== 'success'" class="uploadStatus-progress">{{ uploadItem.progress }}%</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </ElDrawer>
</template>

<script lang="ts" setup>
import * as XLSX from 'xlsx'
import { Check, Close, Loading } from '@element-plus/icons-vue'
const drawerOpen = ref(false)
const router = useRouter()
const activeNames = ref(['0'])
const { uploadState } = useUploadAIStore()

function handleOpen() {
  drawerOpen.value = true
}
function handleClose() {
  drawerOpen.value = false
}
function fileSizeFilter(bytes) {
  if (!bytes) return ''
  bytes = Number(bytes)
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unit = ''
  for (let i = 1; bytes / 1024 >= 1; i++) {
    unit = units[i]
    bytes = bytes / 1024
  }
  return bytes.toFixed(2) + unit
}
function exportCsv(arr) {
  const exportArr = arr.map((item) => ({
    name: item.name,
    status: item.status,
    size: fileSizeFilter(item.file?.size || ''),
    path: item.path,
    isFolder: item.isFolder ? 'yes' : 'no'
  }))
  jsonToXlsx(exportArr)
}
function jsonToXlsx(exportArr) {
  // 自定义下载的header，注意是数组中的数组哦
  const header = {
    name: 'File Name',
    status: 'File Upload Status',
    size: 'File Size',
    path: 'File Path',
    isFolder: 'Is Folder'
  }
  exportArr.unshift(header)

  // 将JS数据数组转换为工作表。
  const ws = XLSX.utils.json_to_sheet(exportArr, {
    header: ['name', 'status', 'size', 'path', 'isFolder'],
    skipHeader: true,
    origin: 'A1'
  })
  /* 新建空的工作表 */
  const wb = XLSX.utils.book_new()
  // 可以自定义下载之后的sheetname
  XLSX.utils.book_append_sheet(wb, ws, 'sheetName')

  /* 生成xlsx文件 */
  XLSX.writeFile(wb, 'upload status.csv')
}
function itemClickHandler(item: any) {
  if (item.status === 'finish' && item.path) {
    router.push({ path: '/browse', query: { path: item.path } })
  }
}
function getPercentage(finish, total) {
  return Math.round((finish / total) * 100)
}
function getRequestTitle(uploadRequestItem) {
  const percentage = getPercentage(uploadRequestItem.finishCount, uploadRequestItem.docList.length)
  if (percentage !== 100) return percentage + '%'
  else if (!uploadRequestItem.aiFinish) return isAIFeature() ? $i18n.t('ai.waitForAi') : $i18n.t('upload.complete')
  else return isAIFeature() ? $i18n.t('ai.uploadcomplete') : $i18n.t('upload.complete')
}
function isAIFeature() {
  return false
  // return allowFeature('AI_CLASSIFICATION')
}
watch(
  uploadState,
  () => {
    console.log('uploadState', uploadState.value)
  },
  {
    deep: true
  }
)
onMounted(() => {
  // 获取uploadStructureDrawer的父元素
  const parent = document.getElementsByClassName('uploadStructureDrawer')[0].parentElement
  if (parent) parent.style.pointerEvents = 'none'
})
useEventListener(document, 'openUploadDrawer', (event: any) => handleOpen(event.detail))
useEventListener(document, 'closeUploadDrawer', (event: any) => handleClose())
</script>

<style lang="scss" scoped>
.el-divider {
  margin: 3px 0 12px 0;
}
.uploadItem {
  display: grid;
  grid-template-columns: 1fr min-content;
  margin-block: calc(var(--app-space-xs) / 2);
  padding-block: calc(var(--app-space-xs) / 2);
  gap: var(--app-space-xs);
}
.nameContainer {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  cursor: pointer;
  .el-button {
    margin: unset;
    padding: unset;
    cursor: unset;
    &:hover {
      background-color: unset;
    }
  }
}
.uploadStatus-exception {
  color: red;
}

.ai-upload-progress {
  :deep(.el-progress-circle) {
    width: 28px !important;
    height: 28px !important;
  }
}
</style>
<style lang="scss">
.uploadStructureDrawer {
  pointer-events: auto;
}
</style>
