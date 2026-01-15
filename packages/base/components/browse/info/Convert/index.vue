<template>
  <div class="convert">
    <div class="sectionHeader">
      <i :class="[{ loading: refreshLoading }, 'el-icon', 'el-icon-refresh', 'icon__hover', 'cursorPointer']" @click="handleGetConversionHistory"></i>
    </div>
    <main class="">
      <div class="section">
        {{ $t('convert_convert') }}
      </div>
      <el-table v-loading="refreshLoading" :data="tableList" size="small">
        <el-table-column prop="fileName" :label="$t('filePopover_fileName')" sortable>
          <template #default="scope">
            <div v-if="scope.row.fileName">{{ scope.row.fileName }}</div>
            <div v-else>{{ filenameWithoutSuffix }}.{{ scope.row.targetFileType }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="fileCreatedDate" :label="$t('filePopover_expiredDate')" sortable>
          <template #default="scope">
            <div v-if="scope.row.fileCreatedDate">{{ displayTime(dayjs(scope.row.fileCreatedDate).add(7, 'day')) }}</div>
            <div v-else>{{ filenameWithoutSuffix }}.{{ scope.row.targetFileType }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('tableHeader_actions')" width="80" align="center">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'COMPLETED'" type="text" @click="handleDownload(scope.row, $event)">{{ $t('download_download') }}</el-button>
            <span v-else-if="scope.row.status === 'ERROR'">{{ $t('commons_error') }}</span>
            <i v-else class="el-icon-loading"></i>
          </template>
        </el-table-column>
      </el-table>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { Loading } from '@element-plus/icons-vue'
import { ElNotification, ElMessage } from 'element-plus'
import dayjs from 'dayjs'
const props = defineProps<{
  doc: any
}>()
const { t } = useI18n()
const refreshLoading = ref(false)
const tableList = ref([])
const { displayTime } = useTime()
const timeStamp = ref(new Date())
const filenameWithoutSuffix = ref('')

async function handleDownload(row) {
  const noti = ElNotification({
    title: $i18n.t('download'),
    icon: Loading,
    dangerouslyUseHTMLString: true,
    message: `<div title="${row.fileName}">${row.fileName}</div>`,
    showClose: true,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const response = (await clientApi.api.postDmsConversionFormatDownload([row.documentPath], {
      format: 'blob'
    })) as any
    const blobStream = new Blob([response], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blobStream)
    downloadUrl(url, row.fileName)
  } catch (error: any) {
    console.error(error)
  } finally {
    noti.close()
  }
}
const handleGetConversionHistory = async () => {
  refreshLoading.value = true
  timeStamp.value = new Date()
  tableList.value = (await clientApi.api.getDmsConversionList({ idOrPath: props.doc.id }).then((res) => res.data)) as any
  setTimeout(() => {
    refreshLoading.value = false
  }, 300)
}

onMounted(() => {
  // handleGetConversionHistory()
  window.addEventListener('refresh-conversion-history', handleGetConversionHistory)
})
onUnmounted(() => {
  window.removeEventListener('refresh-conversion-history', handleGetConversionHistory)
})
watch(
  () => props.doc.name,
  async (newValue) => {
    if (!newValue) return
    await handleGetConversionHistory()
    const name = newValue.split('.').shift()
    filenameWithoutSuffix.value = name
  },
  {
    immediate: true
  }
)
</script>
