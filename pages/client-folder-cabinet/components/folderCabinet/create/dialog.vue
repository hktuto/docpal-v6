<template>
  <el-dialog v-model="state.visible" :title="$t('folderCabinet.newItem')" class="scroll-dialog big" append-to-body>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" v-loading="state.initLoading" @formChange="formChange">
      <template v-slot:metaForm>
        <MetaRenderForm2 ref="MetaFormRef" @formChange="formChange"></MetaRenderForm2>
      </template>
      <template v-slot:namingRule>
        <div>
          {{ $t('tableHeader_labelRule') }}：
          <template v-for="(item, index) in getLabelList(state.cabinetTemplate.labelRule)" :key="index">
            <el-tag>{{ $t(item.metadata || item.metaData) }}</el-tag>
            <template v-if="index !== getLabelList(state.cabinetTemplate.labelRule).length - 1"> -</template>
          </template>
        </div>
      </template>
      <template v-slot:previewName>
        <el-text :type="hasPreviewName(state.previewName) ? '' : 'danger'">
          {{ $t('folderCabinet.previewName') }}：{{ state.previewName }}
        </el-text>
      </template>
    </FormRenderer>
    <template #footer>
      <el-button
        clientFolderCabinetAllowOtherFilesCabinetNewItemNext
        id="FolderCabinet__AllowOtherFilesCabinet__NewItem__Next"
        type="primary"
        :loading="state.loading"
        data-testid="folderCabinet-next-button"
        @click="handleSubmit"
      >
        {{ $t('button.next') }}
      </el-button>
    </template>
  </el-dialog>
  <FolderCabinetCreateNextDialog ref="NextDialogRef" @refresh="emits('refresh')" />
</template>
<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import formJson from './dialog.vform.json'
import { clientApi } from 'api'

const emits = defineEmits(['refresh'])
const { t } = useI18n()
const state = reactive<any>({
  initLoading: false,
  loading: false,
  visible: false,
  cabinetTemplate: {},
  previewName: ''
})
const userId: string = useUserId().value
const NextDialogRef = ref()
const FormRendererRef = ref()
// #region module: handleSubmit
const MetaFormRef = ref()

async function handleSubmit() {
  try {
    // 获取 v-form 数据
    const formData = await FormRendererRef.value.getFormData()
    const arr = ['notificationReminder', 'emailReminder', 'emailReport']
    arr.forEach((key) => {
      formData[key] = {}
      formData[key].intervalTime = formData[`${key}.intervalTime`]
      if (formData[`${key}.tos`]) formData[key].tos = formData[`${key}.tos`]
      if (formData[`${key}.ccs`]) formData[key].ccs = formData[`${key}.ccs`]
      delete formData[`${key}.intervalTime`]
      delete formData[`${key}.tos`]
      delete formData[`${key}.ccs`]
    })
    // 获取 metaForm 数据
    const metaFormData = await MetaFormRef.value.getData()

    if (!formData) return
    state.loading = true
    let fileName = await getMetaName()
    if (!fileName) {
      ElMessage.error(t('dpTip.noValidName'))
      throw new Error('dpTip.noValidName')
    }
    // getUniqueName has bug, will return same name,
    // we need to implement inline function to check if the name is unique

    // const hasSameName = await clientApi.api.postDmsDocumentIsduplicatename({
    //   path: state.cabinetTemplate.documentPath,
    //   titles: [fileName]
    // }).then(res => !!res.data.hasDuplicateTitle)
    // if(hasSameName) {
    //   ElMessage.error($t('dpTip.folderCabinet.duplicateRootFolder'))
    //   throw new Error('dpTip.folderCabinet.duplicateRootFolder')
    // }

    const idOrPath = `${state.cabinetTemplate.documentPath}/${fileName}`
    // 上传最上层数据
    const res = await clientApi.api.postDmsCabinetCreate({
        ...formData,
        title: fileName,
        type: state.cabinetTemplate.documentType,
        idOrPath,
        properties: metaFormData,
        templateId: state.cabinetTemplate.id,
        parentId: state.cabinetTemplate.rootId
      })
      .then((res) => res.data)
    if (res?.id) {
      NextDialogRef.value.handleOpen(state.cabinetTemplate, res)
    }
    await new Promise((resolve) =>
      setTimeout(() => {
        state.visible = false
        emits('refresh')
        resolve(true)
      }, 1000)
    )
  } catch (error) {
    console.error(error)
  }
  state.loading = false
}

async function getMetaName() {
  let formData: any = {}
  try {
    const metadataForm = await MetaFormRef.value.getData()
    const data = await FormRendererRef.value.getFormData(false)
    if (data) formData = { ...formData, ...data, ...metadataForm }
    formData.docName = formData.title
    formData.label = state.cabinetTemplate.label || ''
  } catch (error) {
    console.error(error)
  }
  const labelRules = getLabelList(state.cabinetTemplate.labelRule)
  return getNameByLabelRule(labelRules, formData)
}

// #endregion
function getRequiredMetadata() {
  const labelRules = getLabelList(state.cabinetTemplate.labelRule)
  return labelRules.map((item: any) => item.metadata)
}

// #region module: init
async function handleOpen(id: string) {
  state.initLoading = true
  state.loading = false
  state.visible = true
  try {
    let defaultValue = {}
    state.cabinetTemplate = await clientApi.api.getDmsCabinetTemplateId(id).then((res) => res.data)
    if (state.cabinetTemplate.metadataValue) {
      defaultValue = JSON.parse(state.cabinetTemplate.metadataValue)
    }
    setTimeout(async () => {
      await MetaFormRef.value.init(state.cabinetTemplate.documentType, {
        requiredFields: getRequiredMetadata()
      })
      await FormRendererRef.value.vFormRenderRef.resetForm()
      MetaFormRef.value.setData(defaultValue)
      FormRendererRef.value.vFormRenderRef.setFormData({ ...getReminder(state.cabinetTemplate, ['notificationReminder', 'emailReminder', 'emailReport']) })
      setTitleRequired()
      setTimeout(async () => {
        state.initLoading = false
      }, 500)
    }, 10)
  } catch (error) {
    ElMessage.error(t('dpMsg_error'))
    // state.visible = false
  }

  function getReminder(data: any, revertList: any) {
    return revertList.reduce((prev: any, item: any) => {
      if (!data[item]) data[item] = {}
      if (!data[item].tos) data[item].tos = []
      if (!data[item].ccs) data[item].ccs = []
      const toCreateByIndex = data[item].tos.findIndex((item: any) => item === 'createBy')
      if (toCreateByIndex !== -1) data[item].tos[toCreateByIndex] = userId
      const ccCreateByIndex = data[item].ccs.findIndex((item: any) => item === 'createBy')
      if (ccCreateByIndex !== -1) data[item].ccs[ccCreateByIndex] = userId
      prev[`${item}.intervalTime`] = data[item].intervalTime
      prev[`${item}.tos`] = data[item].tos
      prev[`${item}.ccs`] = data[item].ccs
      return prev
    }, {})
  }

  function setTitleRequired() {
    const labelRule = state.cabinetTemplate.labelRule ? JSON.parse(state.cabinetTemplate.labelRule) : []
    const titleIndex = labelRule.findIndex((item: any) => item.metaData === 'fc:docTitle')
    const titleWidget = FormRendererRef.value.vFormRenderRef.getWidgetRef('title')
    titleWidget.setRequired(titleIndex !== -1)
  }
}

// #endregion
// #region module: form change
async function formChange({ fieldName, formModel, newValue, oldValue }: any) {
  if (state.initLoading) return
  state.previewName = await getMetaName()
}

// #endregion
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
main {
  display: grid;
  gap: var(--app-space-xs);
}

.row-item {
  &-top {
    padding: var(--app-space-xs) 0;
  }
}
:deep(.static-content-item){
  min-height: unset !important;
}
:deep(.static-content-item) {
  // margin-bottom: 10px;
}
.el-text{
  display: block;
  margin-bottom: var(--app-space-m);
}
</style>
