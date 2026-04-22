<template>
  <el-dialog v-model="state.dialogVisible" :title="$t('workflow_bulkImport')"
             destroy-on-close append-to-body :close-on-click-modal="false">
    <ContextFormRender ref="vFormRef" />
    <template #footer>
      <el-button id="Workflow__BulkImport__Cancel" @click="state.dialogVisible = false">
        {{ $t('cancelText') }}
      </el-button>
      <el-button id="Workflow__BulkImport__Submit" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
import formJson from './bulkImport.vform.json'

const routerProvider = inject(MenuRouterKey)
// @ts-ignore
const { t } = useI18n()
const state = reactive({
  dialogVisible: false
})
const vFormRef = ref()

// #region module: dialog
function handleOpen(shareInfo) {
  state.dialogVisible = true
  setTimeout(() => {
    vFormRef.value.setForm(formJson)
  })
}

// #endregion
// #region module: handleSubmit
async function handleSubmit() {
  try {
    const data = await vFormRef.value.getFormData()
    if (!data) throw new Error(`${t('incompleteData')}`)
    const param = {
      processKey: data.processKey,
      businessKey: data.businessKey,
      properties: {
        user_creator_id: data.user_creator_id,
        abbyyCVSFile: data.abbyyCVSFile,
        bulkDocumentsUploadSupplementaryFiles: data.bulkDocumentsUploadSupplementaryFiles,
        // docTypeToProFileId: handelDocTypeToProFileId(data.docTypeToProFileId)
        docTypeToProFileId: data.docTypeToProFileId
      }
    }
    const res: any = await newClientApi.postDocpalWorkflowProcessStart(param).then(res => res.data)
    if (res.errorCode) throw new Error(res.message)
    state.dialogVisible = false
  } catch (error) {
    // routerProvider?.message.error(error.message)
  }
}

// #endregion
defineExpose({ handleOpen })
</script>

<style scoped lang="scss">

</style>
