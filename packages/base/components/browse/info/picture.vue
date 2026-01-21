<template>
  <div v-show="tableList.length > 0" class="PictureSection">
    <div class="infoTitle">
      <span class="title">{{ $t('rightDetail_pictureViews') }}</span>
    </div>
    <div class="overflowHidden">
      <el-table :data="tableList" size="small">
        <el-table-column fixed="left" prop="filename" :label="$t('filePopover_fileName')"></el-table-column>
        <el-table-column prop="width*height" :label="$t('tableHeader_width*height')" align="center" :formatter="formatter"></el-table-column>
        <el-table-column prop="fileSize" :label="$t('tableHeader_fileSize')" align="center" :formatter="formatter"></el-table-column>
        <el-table-column prop="fileFormat" :label="$t('tableHeader_fileFormat')" align="center" :formatter="formatter"></el-table-column>
        <el-table-column fixed="right" width="40" align="center" :formatter="formatter">
          <template #default="scope">
            <el-button type="text" :icon="Download" @click="handleDownload(scope.row, $event)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElNotification, ElMessage } from 'element-plus'
import { Download, Loading } from '@element-plus/icons-vue'
import { clientApi } from 'api'
const props = defineProps<{ doc: any }>()
const { displayTime } = useTime()
const { t } = useI18n()
const tableList = ref<any>([])
function formatter(row: any, column: any) {
  switch (column.property) {
    case 'fileSize':
      return fileSizeFilter(row.fileSize)
    case 'width*height':
      const width = row.width || row.info.width
      const height = row.height || row.info.height
      return width && height ? `${width} x ${height}` : 'NA'
    case 'fileFormat':
      return row.format || row.info.format
  }
}

function fileSizeFilter(bytes: any) {
  bytes = Number(bytes)
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unit = ''
  for (let i = 1; bytes / 1024 >= 1; i++) {
    unit = units[i]
    bytes = bytes / 1024
  }
  return bytes.toFixed(2) + unit
}
async function handleDownload(row: any) {
  const name = row.filename || row.content.name
  const noti = ElNotification({
    title: t('download'),
    icon: Loading,
    dangerouslyUseHTMLString: true,
    message: `<div title="${name}">${name}</div>`,
    showClose: true,
    customClass: 'loading-notification',
    duration: 0,
    position: 'bottom-right'
  })
  try {
    const response = await clientApi.api.getNuxeoDocumentAdditionalFormatDownload(
      { documentId: props.doc.id, fileContentId: row.content },
      {
        type: 'application/json',
        timeout: 0,
        format: 'blob'
      }
    )
    downloadBlob(response, name)
  } catch (error: any) {
    console.error(error)
  } finally {
    noti.close()
  }
}
const getConversionHistory = async () => {
  const res = (await clientApi.api.getDmsDocumentDocumentidAdditionalFormats(props.doc.id).then((res) => res.data)) as any

  tableList.value = res['picture:views'] || res['vid:transcodedVideos'] || []
  return res
}

watch(
  () => props.doc.name,
  async (newValue) => {
    if (!newValue) return
    await getConversionHistory()
  },
  {
    immediate: true
  }
)
</script>
