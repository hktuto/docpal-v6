<template>
  <el-dialog v-model="state.visible" :title="state.title" :close-on-click-modal="false" append-to-body>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="FolderCabinetSetting__Info__CreateNewFileOrFolder__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './addChildDialog.vform.json'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits(['update'])
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: null,
  isFolder: false,
  title: t('folderCabinet.addFolder')
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data) return
    const params = {
      ...data
    }
    if (params.folder) delete params.multiple
    else delete params.allow
    state.loading = true
    if (params.isEdit) {
      params.id = state.setting?.id
      await clientApi.admin.patchAdmindmsCabinetTemplate(params)
    } else {
      const labelRule = [
        {
          dataType: 'string',
          metaData: 'fc:docTitle',
          noDelete: true
        }
      ]
      params.parentId = state.setting?.id
      await clientApi.admin.postAdmindmsCabinetTemplate({ ...params, labelRule: JSON.stringify(labelRule) })
      ElMessage.success(t('tip_createdSuccessMsg', { modelName: t('folder_folderUnder'), name: state.setting.label }))
    }
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.visible = false
    emits('update')
  } catch (error) {}
  state.loading = false
}

function handleOpen(setting: any, children: any, isFolder: boolean) {
  state.visible = true
  state.setting = setting
  state.isFolder = isFolder
  setTimeout(async () => {
    if (!children) children = []
    const interval = setInterval(() => {
      const documentTypeRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('documentType')
      const listName = isFolder ? 'folderList' : 'fileList'
      const options = FormRendererRef.value.vFormRenderRef.optionData[listName]
      if (options.length !== 0) {
        clearInterval(interval)
        options.forEach((oItem: any) => {
          const index = children.findIndex((cItem: any) => cItem.documentType === oItem.value)
          oItem.disabled = index !== -1
        })
        documentTypeRef.loadOptions(options)
      }
    }, 1000)
    await FormRendererRef.value.vFormRenderRef.resetForm()
    await FormRendererRef.value.vFormRenderRef.setFormData({ folder: isFolder })
    state.title = isFolder ? t('folder_cabinetDetailNewFolderTitle', { fileName: state.setting.label }) : t('folderCabinet.addFile')
  }, 500)
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
