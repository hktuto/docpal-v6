<template>
  <div v-loading="loading" class="uploadFromDocpal" ref="uploadFromDocpal" style="height: 70vh" v-if="isReady">
    <FormWidgetUploadFromDocpalSearch v-if="vformOptions.uploadConfig?.type === 'search'" ref="FormRef" v-bind="props" :baseSearch="baseSearch" />
    <FormWidgetUploadFromDocpalBrowse v-else ref="FormRef" v-bind="props" :homeId="homeId" />
    <el-button style="width: 100px" type="primary" :loading="loading" @click="handleUpload">{{ $t('button.uploadFile') }}</el-button>
  </div>
</template>
<script setup lang="ts">
import { newClientApi } from 'api'
const props = defineProps<{
  disabled: boolean
  formData: any
  vformOptions: any
}>()
const loading = ref(false)
const FormRef = ref()
const homeId = ref('')
const isReady = ref(false)
const baseSearch = ref<any>({
  condition: 'and',
  docId: '',
  query: [
    {
      condition: 'and',
      matchs: []
    }
  ]
})
async function downloadAndUpload(row: any) {
  try {
    const blob = await newClientApi.postDmsDocumentDownload(
      { idOrPath: row.id },
      {
        format: 'blob'
      }
    )
    const file = new File([blob], calFileNameAndExt(blob.type, row.name), { type: blob.type })
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'document',
      JSON.stringify({
        properties: {
          'dc:title': file.name
        },
        type: 'File'
      })
    )
    formData.append('nonPermission', true)
    const data = await newClientApi.postDocpalWorkflowUploadFiles(formData).then((res) => res.data)
    return { id: data.id, name: file.name }
  } catch (error) {
    console.log(error)
    return null
  }
}
async function getData() {
  const selectedRows = await FormRef.value.getData()
  const fileDatas = []
  for (const row of selectedRows) {
    const fileData = await downloadAndUpload(row)
    if (!!fileData) fileDatas.push(fileData)
  }
  return fileDatas
}
async function handleUpload() {
  loading.value = true
  const fileDatas = await getData()
  // window 发出事件
  const uploadFromDocpal = new CustomEvent('uploadFromDocpalFinish', {
    detail: { data: fileDatas, name: props.vformOptions.name }
  })
  window.dispatchEvent(uploadFromDocpal)
  loading.value = false
  console.log(props.vformOptions)
}
onMounted(() => {
  if (props.vformOptions.uploadConfig) {
    homeId.value = props.vformOptions.uploadConfig.homeId?.pop()
    if (props.vformOptions.uploadConfig.keyword) {
      baseSearch.value.query[0].matchs.push({
        queryType: 'keyword',
        value: props.vformOptions.uploadConfig.keyword,
        option: {
          fullMatch: false,
          synonyms: false,
          includeLanguages: []
        }
      })
    }
    if (props.vformOptions.uploadConfig.documentType) {
      baseSearch.value.query[0].matchs.push({
        queryType: 'documentTypes',
        value: props.vformOptions.uploadConfig.documentType
      })
    }
  } else {
    homeId.value = '5d3c25e0-46a0-11f0-a88e-7de41a789c95'
    baseSearch.value.query[0].matchs.push({
      queryType: 'keyword',
      value: 'test',
      option: {
        fullMatch: false,
        synonyms: false,
        includeLanguages: []
      }
    })
  }
  setTimeout(() => {
    isReady.value = true
  }, 50)
})
</script>

<style scoped lang="scss">
.uploadFromDocpal {
  display: grid;
  grid-template-rows: 1fr min-content;
}
</style>
