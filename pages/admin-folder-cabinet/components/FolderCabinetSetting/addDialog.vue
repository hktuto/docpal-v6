<template>
  <el-dialog
    class="scroll-dialog"
    v-model="state.visible"
    :title="state.isEdit ? $t('folderCabinet.edit') : $t('folderCabinet.add')"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <template #footer>
      <el-button id="FolderCabinetSetting__CreateNewFolderCabinet__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi, adminApi } from 'api'
import formJson from './addDialog.vform.json'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits(['update'])
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: null,
  isEdit: false,
  oldName: ''
})

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (state.oldName != data.name) {
      const { data: checkName } = await clientApi.api.postDmsCabinetTemplateDuplicateName({ label: data.label })
      if (checkName) {
        ElMessage.error(t('common_nameExists'))
        return
      }
    }

    const params = {
      ...data,
      binds: data.userGroups.map((value: string) => {
        const values = value.split('&&&&')
        return {
          bindId: values[1],
          type: values[0]
        }
      })
    }
    state.loading = true
    let response
    if (state.isEdit) {
      params.id = state.setting.id
      const { data: patchData } = await clientApi.api.patchDmsCabinetTemplate({
        ...params,
        rootId: data.cabinetRoot.pop()
      })

      response = patchData
    } else {
      const { data: createData } = await clientApi.api.postDmsCabinetTemplate({
        documentType: 'Folder',
        ...params,
        rootId: data.cabinetRoot.pop(),
        status: 'A'
      })
      response = createData
    }
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.visible = false
    emits('update', {
      edit: state.isEdit,
      response
    })
    let msg = state.isEdit
      ? t('tip_updateMsg', { modelName: t('tip_SelectedMsg') + t('menus_folderCabinet'), name: null })
      : t('tip_createdMsg', { modelName: t('tip_newMsg') + t('menus_folderCabinet'), name: null })
    ElMessage.success(msg)
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }
}

function handleOpen(setting: any) {
  state.visible = true
  state.loading = false
  if (setting) {
    state.isEdit = true
    state.setting = setting
    state.oldName = setting.name
    // try {
    setTimeout(async () => {
      await FormRendererRef.value.vFormRenderRef.resetForm()
      state.loading = true
      if (!setting.binds) setting.binds = []
      const data = {
        ...setting,
        cabinetRoot: await getRootIds(setting.rootId),
        userGroups: setting.binds.reduce((prev: any, item: any) => {
          const value = item.type + '&&&&' + item.bindId
          prev.push(value)
          return prev
        }, [])
      }
      await FormRendererRef.value.vFormRenderRef.setFormData(data)
      state.loading = false
    })
    // } catch (error) {
    //   state.loading = false;
    // }
  } else {
    state.isEdit = false
    state.setting = {}
    setTimeout(() => {
      FormRendererRef.value.vFormRenderRef.resetForm()
    })
  }
}

async function getRootIds(idOrPath: string) {
  try {
    const data = await adminApi.api.postNuxeoDocumentBreadcrumb({ idOrPath }).then((res) => res.data)
    return data?.map((item) => item.id).filter((item: any) => item !== 'root')
  } catch (error) {
    return []
  }
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
