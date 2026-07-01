<template>
  <div class="pageContainer">
    <main class="share-main" v-loading="state.loading">
      <FormRenderer ref="FormRendererRef" class="div1" :form-json="formJson" />
      <div class="div2" v-loading="previewFile.loading">
        <template v-if="state.loadingFileFail">
          <div class="no-file-preview">{{ $t('tip.loadingFileFail') }}</div>
        </template>
        <template v-else-if="previewFile.name">
          <div class="reader-container">
            <h3>{{ previewFile.name }}</h3>
            <Reader ref="ReaderRef" v-bind="previewFile"></Reader>
          </div>
        </template>
        <template v-else>
          <div class="no-file-preview">{{ $t('tip.pleaseSelectFile') }}</div>
        </template>
      </div>
      <BrowseShareTableSet :tableData="state.minTypeShareList" class="div3" @db-click="handleDblclick"
                           @delete="handleDeleteRow" />
      <div class="div4 flex-x-end">
        <div>
          <!-- <el-button type="primary" @click="handleAddMore">{{ $t('share.addMore') }}</el-button> -->
          <!-- <el-button type="info" @click="handleDiscard">{{ $t('discard') }}</el-button> -->
          <el-button type="primary" @click="handleSubmit">{{ $t('dpButtom_confirm') }}</el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'

const { updateShareList, getMineTypeShareList, getUseWatermark, shareList } = useShareStore()
import formJson from './shareRequest.vform.json'

const FormRendererRef = ref()
const { diffMinute } = useTime()
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)

const props = defineProps<{
  backPath: string
}>()

const state = reactive<any>({
  minTypeShareList: [],
  interval: null,
  loading: false,
  backPath: '/browse',
  loadingFileFail: false
})

const previewFile = reactive<any>({
  blob: null,
  name: '',
  id: '',
  path: '',
  loading: false,
  options: {
    noDownload: true,
    print: false,
    loadAnnotations: false,
    readOnly: true
  }
})

async function handleDblclick(row: any) {
  previewFile.loading = true
  state.loadingFileFail = false
  try {
    if (row.watermark) {
      if (!!state.interval) clearInterval(state.interval)
      let intervalNum = 0
      state.interval = setInterval(async () => {
        intervalNum++
        if (intervalNum === 50) {
          clearInterval(state.interval)
          handlePreviewFail()
        }

        const res = await newClientApi.getDmsSharePrepareDownloadDocidGetDownloadStatus(row.id).then(res => res.data)
        if (res === 'YES') {
          clearInterval(state.interval)

          previewFile.blob = await newClientApi.getDocpalWatermarkDocumentPreview(
            {
              watermarkTemplateId: row.watermark,
              documentId: row.id
            },
            {
              format: 'blob',
              timeout: 0
            }
          )
          previewFile.loading = false
        }
      }, 1000)
    } else {
      previewFile.blob = await newClientApi.postDmsDocumentPreview(
        { idOrPath: row.id },
        {
          format: 'blob',
          timeout: 0
        }
      )
      previewFile.loading = false
    }
    previewFile.name = row.name
    previewFile.id = row.id
  } catch (error) {
    handlePreviewFail()
  }

  function handlePreviewFail() {
    previewFile.loading = false
    state.loadingFileFail = true
  }
}

function isValidateEmail(emailList) {
  let isValidate = true
  const emailRef = FormRendererRef.value.vFormRenderRef?.getWidgetRef?.('emailList')
  let contactList = emailRef?.getOptionItems()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  emailList.forEach((item: any) => {
    if (!emailRegex.test(item) && !isInContactList(item)) {
      ElMessage.error(t('tip.enterValidEmail') + ' 【' + item + '】')
      isValidate = false
    }
  })
  return isValidate

  function isInContactList(email: string) {
    if (!contactList) contactList = []
    return contactList.some((item: any) => item.value === email)
  }
}

async function handleSubmit() {
  try {
    state.loading = true
    if (!!state.interval) clearInterval(state.interval)
    const formData = await FormRendererRef.value.getFormData()
    if (!formData) throw new Error('no emailList')
    if (!isValidateEmail(formData.emailList)) return
    const param = {
      emailList: formData.emailList,
      documentList: documentIdListGet(),
      password: formData.password ? formData.password : '',
      tokenLiveInMinutes: diffMinute(formData.dueDate)
    }
    await newClientApi.postDmsShareNew(param).then(res => res.data)
    routerProvider?.message.success(t('share_success'))
    console.log('share_success', '=================share_success=================', updateShareList)
    updateShareList([])
    const item = createBrowseListPageParams({
      idOrPath: props.backPath
    })
    routerProvider?.back(item)
  } catch (error: any) {
    console.error(error.message)
    routerProvider?.message.error(error.message)
  } finally {
    state.loading = false
  }
  // function watermarkListGet() {
  //     return state.minTypeShareList.reduce((prev,item) => {
  //         if (item.watermark) prev[item.id] = item.watermark

  //         return prev
  //     }, {})
  // }
  function documentIdListGet() {
    return state.minTypeShareList.map((item: any) => ({
      docId: item.id,
      readOnly: item.readOnly,
      watermarkTemplateId: item.watermark || ''
    }))
  }
}

function handleDeleteRow(row: any) {
  if (state.minTypeShareList.length === 1) {
    handleDiscard(row)
  } else {
    const index = state.minTypeShareList.findIndex((item: any) => row.id === item.id)
    state.minTypeShareList.splice(index, 1)
    updateShareList(state.minTypeShareList)
  }
}

async function handleDiscard(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('tip.confirmWhetherToDiscardShareQueue')}`)
    if (action !== 'confirm') return
    console.log(row, '=================row=================')
    const index = state.minTypeShareList.findIndex((item: any) => row.id === item.id)
    state.minTypeShareList.splice(index, 1)
    if (!!state.interval) clearInterval(state.interval)
    updateShareList([])
    const item = createBrowseListPageParams({
      idOrPath: props.backPath
    })
    routerProvider?.navigateTo(item)
  } catch (error) {
    console.log(error)
  }
}

function handleAddMore() {
  if (!!state.interval) clearInterval(state.interval)
  const item = createBrowseListPageParams({
    idOrPath: props.backPath
  })
  routerProvider?.navigateTo(item)
}

watch(
  shareList,
  async (newVal) => {
    try {
      state.minTypeShareList = await getMineTypeShareList()
      if (state.minTypeShareList.length === 0) {
        const item = createBrowseListPageParams({
          idOrPath: props.backPath
        })
        routerProvider?.navigateTo(item)
      }
      const mimeTypeList = state.minTypeShareList.reduce((prev: any, item: any) => {
        if (item.mimeType && getUseWatermark(item.mimeType)) prev.push(item.id)
        return prev
      }, [])
      newClientApi.postDmsSharePrepareDownloadCheckFileComplete(mimeTypeList).then(r => r.data)
    } catch (error) {
      console.log(error)
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// onMounted(async () => {
//   state.backPath = props.backPath || '/'
//   try {
//     state.minTypeShareList = await getMineTypeShareList()
//   } catch (error) {

//   }
//   if (state.minTypeShareList.length === 0) {
//     const item = createBrowseListPageParams({
//       idOrPath: props.backPath
//     })
//     routerProvider?.navigateTo(item)
//   }
//   const mimeTypeList = state.minTypeShareList.reduce((prev: any, item: any) => {
//     if (item.mimeType && getUseWatermark(item.mimeType)) prev.push(item.id)
//     return prev
//   }, [])
//   newClientApi.postDmsSharePrepareDownloadCheckFileComplete(mimeTypeList)
// })
onUnmounted(() => {
  if (!!state.interval) clearInterval(state.interval)
})
</script>

<style lang="scss" scoped>
.pageContainer {
  height: 100%;
  width: 100%;
  padding: var(--app-space-xs);
  position: relative;
  overflow: hidden;
}

.share-main {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: min-content 1fr min-content;
  gap: var(--app-space-xs);

  .div1 {
    grid-area: 1 / 1 / 2 / 2;
  }

  .div2 {
    grid-area: 1 / 2 / 3 / 3;
  }

  .div3 {
    grid-area: 2 / 1 / 3 / 2;
  }

  .div4 {
    grid-area: 3 / 1 / 4 / 3;
  }

  .div1,
  .div2,
  .div3,
  .div4 {
    overflow: hidden;
  }

  .reader-container {
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
  }
}

.no-file-preview {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
</style>
