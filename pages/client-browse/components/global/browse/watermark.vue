<script lang="ts" setup>
import { newClientApi } from 'api'
import { ElNotification } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { docId } = defineProps<{
  docId: string
  docName: string
}>()
const breadcrumb = ref<any[]>([])
const watermarkDetail = ref<any>({
  name: 'tem_' + new Date().getTime(),
  type: 'dynamic',
  watermarkSettings: []
})
const doc = ref<any>({ name: '' })
const errorOpen = ref(false)
const templateList = ref<any[]>([])

async function getTemplateList() {
  const data = await newClientApi.getDocpalWatermarkTemplatesAll().then(r => r.data)
  templateList.value = data.sort((a, b) => a.name.localeCompare(b.name))
}

async function getWatermarkDetail() {
  // get document detail from route
  doc.value = await newClientApi.postDmsDocumentFetch({ idOrPath: docId }).then((res) => res.data)
  const mimeType = getMimeTypeFromDocument(doc.value)
  if (!mimeType || (!mimeType.includes('image') && !mimeType.includes('pdf') && !mimeType.includes('video'))) {
    errorOpen.value = true
  }
  // get breadcrumb
  const list = (await newClientApi.postDmsDocumentBreadcrumb({ idOrPath: doc.value.parentRef }).then((res) => res.data)) || []
  if (list.length === 0) return
  breadcrumb.value = list.map((item: any) => item.id)
}

function cancel() {
  const newItem = createDetailPageParams({
    idOrPath: docId,
    docName: doc.value.name,
    ...doc.value
  })
  routerProvider?.navigateTo(newItem)
}

const { getWatermarkTemplateDetail, createWatermarkTemplate } = useWatermark()
const changeTemplateDialog = ref(false)

const selectedTemplateId = ref('')

async function templateChange(command: string) {
  changeTemplateDialog.value = true
  selectedTemplateId.value = command
}

async function confirmChangeTemplate() {
  const temp = await getWatermarkTemplateDetail(selectedTemplateId.value)
  let idTime = new Date().getTime()
  watermarkDetail.value = {
    ...watermarkDetail.value,
    watermarkSettings: temp.watermarkSettings.map((item: any) => {
      delete item.templateId
      item.id = 'object_' + idTime + 1
      idTime++
      return item
    })
  }

  if (temp.type === 'dynamic') watermarkDetail.value.contentType = temp.content
  changeTemplateDialog.value = false
}

const watermarkRef = ref()
const previewDialog = ref(false)
const previewFile = reactive({
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
const temTemplate = ref()

async function preview() {
  // save template

  const { update } = await watermarkRef.value.save()
  if (update.watermarkSettings.length === 0) {
    ElNotification.error(t('msg_watermark_empty') as string)
    return
  }
  previewFile.loading = true
  previewDialog.value = true
  temTemplate.value = await createWatermarkTemplate(update)
  console.log(temTemplate.value)

  previewFile.blob = await newClientApi.getDocpalWatermarkDocumentPreview(
    {
      watermarkTemplateId: temTemplate.value.id,
      documentId: doc.value.id
    },
    {
      format: 'blob',
      timeout: 0
    }
  )
  previewFile.loading = false
  previewFile.name = doc.value.name
  previewFile.id = doc.value.id
}

async function saveNewVersion() {
  const response = await newClientApi.postDmsDocumentWatermark({
    idOrPath: doc.value.id,
    watermarkTemplateId: temTemplate.value.id
  }).then(r => r.data)
  previewDialog.value = false
  ElNotification.success(t('msg_successfullyModified') as string)
  cancel()
}

const newFileDialog = ref(false)

const newFileForm = reactive<any>({})

async function saveNewFile() {
  newFileForm.name = doc.value.name
  // get displayMeta

  previewDialog.value = false
  newFileDialog.value = true
  nextTick(() => {
    getDisplayMeta(doc.value.type || doc.value.documentType || doc.value.docpalType)
  })
}

const metaFormRef = ref()
const pathFormRef = ref()

async function getDisplayMeta(documentType: string) {
  await metaFormRef.value.init(documentType, { isFolder: false })
  metaFormRef.value.setData({ ...doc.value.properties, documentType })
}

function cancelSaveNewFile() {
  previewDialog.value = true
  newFileDialog.value = false
}

async function confimSaveNewFile() {
  try {
  // TODO : check path is valid
    const properties = await metaFormRef.value.getData()
    const { path } = await pathFormRef.value.getData()
    const idOrPath = path.pop()
    const isDuplicate: boolean = await newClientApi.postDmsDocumentNameValidate({
      parentPath: idOrPath,
      name: newFileForm.name
    }).then((res) => res.data.hasDuplicateTitle)

    if (isDuplicate) {
      routerProvider?.message.error(t('dpTip_duplicateError'))
      return
    }

    const params = {
      idOrPath,
      name: newFileForm.name,
      properties,
      watermarkTemplateId: temTemplate.value.id,
      originDocumentId: doc.value.id
    }

    const newFile = await newClientApi.postDmsDocumentCopyWatermark(params).then(r => r.data)
    const newItem = createDetailPageParams({
      idOrPath: newFile.id,
      docName: newFile.name,
      ...newFile
    })

    routerProvider?.navigateTo(newItem)
    // router.push({
    //     path: '/browse',
    //     query: {
    //         docId: newFile.id
    //     }
    // })
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  watermarkDetail.value = {
    name: 'tem_' + new Date().getTime(),
    type: 'dynamic',
    watermarkSettings: []
  }
})

onMounted(() => {
  getWatermarkDetail()
  getTemplateList()
})
</script>

<template>
  <NuxtLayout :pageTitle="doc.name">
    <div class="pageContainer">
      <WatermarkDetail v-if="watermarkDetail" ref="watermarkRef" :detail="watermarkDetail">
        <template #footer>
          <div class="footerAction">
            <ElDropdown @command="templateChange">
              <ElButton>Choose Template</ElButton>
              <template #dropdown>
                <el-dropdown-menu>
                  <ElDropdownItem v-for="item in templateList" :key="item.id" :command="item.id">{{ item.name }}
                  </ElDropdownItem>
                </el-dropdown-menu>
              </template>
            </ElDropdown>
            <ElButton @click="cancel">Cancel</ElButton>
            <ElButton type="primary" @click="preview">Confirm</ElButton>
          </div>
        </template>
      </WatermarkDetail>
    </div>
    <ElDialog v-model="errorOpen" width="300px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="warning">
        {{ $t('error_watermark_mimetype') }}
      </div>
    </ElDialog>
    <ElDialog v-model="changeTemplateDialog" width="300px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="message">
        {{ $t('watermark_template_warning') }}
      </div>
      <div class="action">
        <ElButton @click="changeTemplateDialog = false">Cancel</ElButton>
        <ElButton type="primary" @click="confirmChangeTemplate">Confirm</ElButton>
      </div>
    </ElDialog>

    <ElDialog v-model="previewDialog" :close-on-click-modal="false" :close-on-press-escape="false">
      <div v-loading="previewFile.loading" class="readerContainer">
        <Reader ref="ReaderRef" v-bind="previewFile"></Reader>
      </div>
      <template #footer>
        <ElButton :disabled="previewFile.loading" @click="previewDialog = false">Cancel</ElButton>
        <ElButton :disabled="previewFile.loading" type="primary" @click="saveNewVersion">Save As New Version</ElButton>
        <ElButton :disabled="previewFile.loading" type="primary" @click="saveNewFile">Save As New File</ElButton>
      </template>
    </ElDialog>
    <ElDialog v-model="newFileDialog" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="formContainer">
        <ElForm :model="newFileForm" label-position="top" @submit.stop="confimSaveNewFile">
          <ElFormItem label="File Name">
            <ElInput v-model="newFileForm.name" placeholder="New File Name" />
          </ElFormItem>
          <MetaPathForm ref="pathFormRef" :defaultPath="breadcrumb"></MetaPathForm>
          <MetaRenderForm2 ref="metaFormRef" mode="normal"></MetaRenderForm2>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="cancelSaveNewFile">Cancel</ElButton>
        <ElButton type="primary" @click="confimSaveNewFile">Confirm</ElButton>
      </template>
    </ElDialog>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.readerContainer {
  width: 100%;
  height: 60vh;
  position: relative;
  overflow: hidden;
}

.pageContainer {
  width: 100%;
  height: 100%;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.footerAction {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  gap: calc(var(--app-space-xs) / 2);
  padding-inline: var(--app-space-xs);
}
.message{
  margin-block: var(--app-space-m);
}
</style>
