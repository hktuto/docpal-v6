<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <slot name="toolbar_buttons"></slot>
    </template>
    <template #logicalPath="{ row }">
      <el-button v-if="row.readOnly" type="primary" text disabled>
        {{ $t('button.readOnly') }}
      </el-button>
      <el-button v-else-if="row.watermarkStatus === 'NO'" type="primary" text disabled> {{ $t('msg_converting') }}... </el-button>
      <el-button v-else-if="!row.watermarkStatus || row.watermarkStatus === 'YES'" type="primary" :loading="row.downloading" @click="handleDownload(row)">
        {{ $t('download') }}
      </el-button>
      <el-button v-else text type="danger" disabled>
        {{ $t('msg_conversion_failed') }}
      </el-button>
    </template>
  </VxeGrid>
  <ReaderDialog ref="ReaderRef" v-bind="previewFile" :options="{ readOnly: true, print: false, loadAnnotations: false }"> </ReaderDialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'

const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'public-share',
  columns: [
    { field: 'title', title: 'tableHeader_name', fixed: 'left' },
    { field: 'fileExtension', title: 'docInfo.fileExtension' },

    {
      field: 'fileSize',
      title: 'search.size',
      formatter: ({ cellValue }: any) => {
        return formatFileSize(cellValue)
      }
    },
    {
      field: 'lastModified',
      title: 'tableHeader_modifiedDate',
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    {
      field: 'type',
      title: 'tableHeader_type'
    },
    {
      title: 'dpTable_permission',
      field: 'logicalPath',
      slots: {
        default: 'logicalPath'
      }
    }
  ],

  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})
const ReaderRef = ref()
const previewFile = reactive<any>({
  blob: null,
  name: '',
  id: '',
  loading: false,
  options: {
    noDownload: true,
    print: false,
    loadAnnotations: false,
    readOnly: true
  }
})
const route = useRoute()
async function handleDblclick(row: any) {
  ReaderRef.value.handleOpen()
  previewFile.loading = true
  const fileId = row.id
  try {
    const params: any = {
      token: route.query.token || row.token,
      password: sessionStorage.getItem('sharePWD'),
      documentId: fileId
    }
    previewFile.blob = await clientApi.api.getDmsPublicShareDocumentsDocumentidPreview(params, {
      format: 'blob'
    })
  } catch (error) {}
  previewFile.id = fileId
  previewFile.name = row.title
  previewFile.loading = false
}
async function handleDownload(row: any) {
  // ReaderRef.value.handleOpen(row);
  row.downloading = true
  try {
    const params: any = {
      token: route.query.token,
      password: sessionStorage.getItem('sharePWD'),
      documentId: row.id
    }
    const blob: any = await clientApi.api.getDmsPublicShareDocumentsDocumentidDownload(params, {
      format: 'blob'
    })
    downloadBlob(blob, row.name || row.title, blob.type)
  } catch (error) {
    console.error(error)
  } finally {
    row.downloading = false
  }
}
function loadData(arr: any) {
  tableRef.value?.loadData(arr)
}
defineExpose({
  loadData
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
