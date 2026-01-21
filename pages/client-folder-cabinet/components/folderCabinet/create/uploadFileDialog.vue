<template>
  <el-dialog class="scroll-dialog" v-model="state.dialogOpened" append-to-body :close-on-click-modal="false">
    <template #header>
      <strong class="primaryTitle">{{ $t('filePopover_uploadFile') }}</strong>
      {{ 'in ' + state.setting.documentPath }}
    </template>
    <div>
      {{ $t('tableHeader_labelRule') }}：
      <template v-for="(item, index) in getLabelList(state.setting.labelRule)" :key="index">
        <el-tag>{{ $t(item.metadata || item.metaData) }}</el-tag>
        <template v-if="index !== getLabelList(state.setting.labelRule).length - 1"> -</template>
      </template>
    </div>
    <el-text :type="hasPreviewName(state.setting.previewName) ? '' : 'danger'" style="margin-bottom: 15px"
    >{{ $t('folderCabinet.previewName') }}：{{ state.setting.previewName }}
    </el-text
    >
    <FormUpload v-model="state.fileList" :limit="1" @change="handleChange"></FormUpload>
    <MetaRenderForm2 ref="MetaFormRef" mode="folderCabinet" @formChange="handleMetaChange"></MetaRenderForm2>
    <template #footer>
      <el-button id="FolderCabinet__Detail__Create__Submit" :loading="state.loading" type="primary"
                 @click="handleSubmit">{{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['success'])
const route = useRoute()
const state = reactive<any>({
  loading: false,
  dialogOpened: false,
  setting: {},
  fileList: [],
  metaFormData: {},
  previewName: ''
})
const MetaFormRef = ref()
const { t } = useI18n()

function getMetaName(formData: any = {}) {
  try {
    if (!!state.metaFormData)
      formData = {
        ...formData,
        ...state.metaFormData,
        label: state.setting.label
      }
  } catch (error) {
  }
  const labelRules = getLabelList(state.setting.labelRule)
  return getNameByLabelRule(labelRules, formData)
}

async function handleChange() {
  const file = state.fileList[0]
  await MetaFormRef.value.setData({ docName: file.name.split('.').shift() })
}

async function handleMetaChange(data: any) {
  state.metaFormData = data.formModel
  state.setting.previewName = getMetaName()
}

function handleOpen(setting: any) {
  state.dialogOpened = true
  state.setting = deepCopy(setting)
  state.fileList = []
  let defaultValue = {}
  if (state.setting.metadataValue) defaultValue = JSON.parse(state.setting.metadataValue)
  nextTick(async () => {
    await MetaFormRef.value.init(state.setting.documentType)
    MetaFormRef.value.setData({ ...defaultValue })
  })
}

async function handleSubmit() {
  try {
    const metaFormData = await MetaFormRef.value.getData()
    if (!metaFormData) return
    if (!state.setting.previewName) {
      ElMessage.error(t('dpTip.noValidName'))
      throw new Error('dpTip.noValidName')
    }
    if (!state.fileList || state.fileList.length === 0) {
      ElMessage.error(t('msg_fileFetchFailed'))
      throw new Error('msg_fileFetchFailed')
    }
    const file = state.fileList[0]
    state.loading = true
    const inputFile: any = {
      name: state.setting.previewName,
      properties: metaFormData,
      idOrPath: state.setting.documentPath + '/' + state.setting.previewName,
      type: state.setting.documentType
    }
    const duplicateResult: any = await clientApi.api.postDmsDocumentIsduplicatename({
        path: state.setting.documentPath,
        titles: [state.setting.previewName]
      }).then((res: any) => res.data)
    if (duplicateResult[state.setting.previewName]) {
      if (state.setting.repeatName) {
        handleReplace(
          {
            idOrPath: duplicateResult[state.setting.previewName].idOrPath,
            properties: metaFormData
          },
          file
        )
        return
      } else {
        inputFile.name = duplicateResult[state.setting.previewName].uniqueName
        inputFile.idOrPath = state.setting.documentPath + '/' + inputFile.name
      }
    }
    inputFile.templateId = route.query.tab
    inputFile.layoutId = state.setting.templateId
    delete inputFile.properties.docName
    const formData: any = new FormData()
    inputFile.dfcId = state.setting.id
    formData.append('files', file)
    formData.append('document', JSON.stringify(inputFile))
    const res = await clientApi.api.postDmsDocument(formData).then(r => r.data)
    emits('success', inputFile)
    state.dialogOpened = false
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

async function handleReplace(inputFile: any, file: any) {
  const formData: any = new FormData()
  formData.append('file', file)
  formData.append('document', JSON.stringify(inputFile))
  state.loading = true
  try {
    const res = await clientApi.api.patchDmsDocumentContent(formData, formData).then(r => r.data)
    state.dialogOpened = false
    emits('success', inputFile)
  } catch (error) {
  } finally {
    state.loading = false
  }
}

defineExpose({ handleOpen })
</script>
