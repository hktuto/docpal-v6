<template>
  <DialogFullscreen v-model="state.dialogVisible" :fullscreen="state.fullscreen" destroy-on-close append-to-body
                    :title="t('file_generateTemplate')" :close-on-click-modal="false" width="90%" height="50%"
                    :align-center="true" @closed="reset">
    <el-select v-model="form.templatePath" clearable filterable :disabled="state.loading"
               popper-class="dialog-select-dropdown" @change="templateParamGet">
      <el-option v-for="(item,index) in state.templateList" :key="index" :label="item.name" :value="item.path" />
    </el-select>
    <div class="body_content" v-if="form.templatePath" v-loading="state.variableLoading">
      <div class="template_form" style="min-height: 50px; height: 100%">
        <div class="preview">
          <DocTemplateViewer ref="wordTemplateViewerRef" v-if="state.fileType=== 'json' && state.showViewer"
                             :options="state.documentOptions" :json="state.jsonData" />
          <Reader v-if="previewFile.blob" v-bind="previewFile" />
        </div>
        <div style="max-width: 820px; overflow-y: auto">
          <DocTemplateVariablesRenderer ref="templateVariablesRendererRef" v-if="state.fileType==='json'"
                                        @update="handleTestVariable" />
          <FormVariablesRenderer v-else ref="FormVariablesRendererRef" />
        </div>
      </div>
    </div>
    <template #footer>
      <el-button id="Workflow__PersonalWorkflow__Cancel" @click="state.dialogVisible = false">
        {{ $t('dpButtom_cancel') }}
      </el-button>
      <el-button id="Workflow__PersonalWorkflow__Preview" type="primary" v-if="state.canDownload"
                 :loading="state.loading" @click="generatePreviewFile">
        {{ $t('common_preview') }}
      </el-button>
      <el-button id="Workflow__PersonalWorkflow__Download" type="primary" v-if="state.canDownload"
                 :loading="state.loading" @click="handleSubmit">
        {{ $t('common_download') }}
      </el-button>
    </template>
  </DialogFullscreen>

</template>

<script lang="ts" setup>
import { newClientApi, templateApi } from 'api'
import { replaceVariables, generateVariables } from 'docpal-document-editor/src/utils'

const routerProvider = inject(MenuRouterKey)
// @ts-ignore
const { t } = useI18n()
// @ts-ignore
const state = reactive<any>({
  dialogVisible: false,
  loading: false,
  variableLoading: false,
  templateList: [],
  canSubmit: false,
  fileType: '',
  canDownload: false,
  showViewer: false,
  wordJson: {},
  documentOptions: [],
  jsonData: {},
  variables: [],
  generateVariables: {},
  fullscreen: false,
  fileName: ''
})
// @ts-ignore
const form = reactive({
  templatePath: '',
  paramList: []
})
const previewFile = reactive<{
  name: string,
  blob: Blob | null
}>({
  name: '',
  blob: null
})
const wordTemplateViewerRef = ref()
const templateVariablesRendererRef = ref()

function handleOpen() {
  state.dialogVisible = true
}

function handleTestVariable(variables: any) {
  state.variables = variables
  state.generateVariables = generateVariables(variables)
}

async function generatePreviewFile() {
  try {
    state.loading = true
    state.showViewer = false
    if (state.fileType === 'json') {
      state.jsonData.content = replaceVariables(state.jsonData.content, state.variables)
      wordTemplateViewerRef.value.initEditor(state.documentOptions, state.jsonData)
      state.showViewer = true
      return
    }

    const res = await generateFile()
    const ext = mimeTypeToExtension(res.type)
    previewFile.blob = res
  } catch (e) {
    console.log(e)
  } finally {
    state.loading = false
  }
}

async function generateFile() {
  const data = await FormVariablesRendererRef.value.getData()
  return await newClientApi.postDmsTemplateDocumentGenerateFile({
    templatePath: form.templatePath,
    paramsMap: data
  }, {
    format: 'blob'
  })
}

// #endregion
async function handleSubmit(fileType: string) {
  state.loading = true
  try {
    let res
    if (state.fileType === 'json') {
      state.generateVariables = generateVariables(state.variables)
      const data = {
        data: state.generateVariables,
        template: state.wordJson
      }
      res = await templateApi.convert.postConvertGeneratedatatodocx(data, {
        format: 'blob'
      })
    } else {
      res = await generateFile()
      if (!res || res.errorCode) {
        throw new Error(`${t('responseMsg_errorCode_2')}`)
      }
    }

    // @ts-ignore
    downloadBlob(res, state.fileName)
    state.dialogVisible = false
  } catch (error) {
    console.log(error)
    throw error
  }
  state.loading = false
}

// @ts-ignore
const FormVariablesRendererRef = ref()

async function templateParamGet(templatePath: string) {
  state.fileType = state.templateList.find((item: any) => item.path === templatePath).fileSuffix
  state.canDownload = false
  state.variableLoading = true
  previewFile.blob = null

  // word
  if (state.fileType === 'json') {
    const dataJson = await newClientApi.postDmsDocumentPreview({ idOrPath: form.templatePath })
    state.wordJson = dataJson
    state.jsonData = dataJson.json.content
    state.documentOptions = dataJson.json.options
    state.variables = dataJson.variables
    templateVariablesRendererRef.value.setVariables(deepCopy(state.variables))
    state.showViewer = true
    state.canDownload = true
    state.variableLoading = false
    return
  }

  // excel and ppt
  try {
    const res: any = await newClientApi.postDmsTemplateDocumentVariables({
      templatePath
    }).then(res => res.data)
    form.paramList = [...new Set(res.paramsList)].map(item => ({
      name: item,
      type: 'input',
      required: true
    }))
    // get preview file
    previewFile.blob = await newClientApi.postDmsDocumentPreview(
      { idOrPath: templatePath },
      {
        format: 'blob',
        timeout: 0,
        headers: {
          key: 'preview'
        }
      }
    )
    FormVariablesRendererRef.value.createJson(form.paramList)
    state.canDownload = true
  } catch (error) {
    // routerProvider?.message.error(error?.response?.data?.message || error.message)
  }
  state.variableLoading = false
}

// @ts-ignore
onMounted(async () => {
  try {
    state.templateList = await newClientApi.postDmsTemplateDocumentList().then(res => res.data) || []
  } catch (error) {
    console.log(error)
    state.templateList = []
  }
})

const reset = () => {
  previewFile.blob = null
  form.templatePath = ''
  form.paramList = []
  state.fileType = ''
  state.showViewer = false
}

watch(() => form.templatePath, (newValue) => {
  if (!newValue || newValue === '') return
  const item = state.templateList.find((item: any) => item.path === newValue)
  if (item?.fileSuffix === 'json') {
    state.fileName = item.name + '.docx'
  } else {
    state.fileName = item?.fileContentName || ''
  }
})
defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.template_form {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: calc(var(--app-space-xs) * 2);
  height: 100%;
  min-height: 400px;
  overflow: hidden;

  @media (max-width: 1200px) {
    grid-template-columns: 1.5fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

.body_content {
  height: calc(100vh - 160px);
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    height: calc(100vh - 150px);
    max-height: calc(100vh - 150px);
  }
}

.preview {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.editorContainer) {
    height: 100%;
    min-height: 0;
  }

  :deep(.editorBody) {
    height: 100% !important;
    min-height: 0;
    overflow: auto;
  }

  :deep(.docxContainer),
  :deep(.iframeContainer),
  :deep(.contentContainer) {
    height: 100%;
    overflow: auto;
  }

  :deep(iframe) {
    width: 100%;
    height: 100%;
    border: none;
  }
}

.template_form > div:last-child {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  :deep(.renderer-container) {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
  }
}
</style>
