<template>
  <el-dialog
    :title="$t(state.title)"
    v-model="state.dialogVisible"
    :close-on-click-modal="false"
    append-to-body>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="Browse__CreateInternalSharing__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'

import { newClientApi } from 'api'
import formJson from './AclForm.json'

const emit = defineEmits(['handleUpdate', 'handleAdd'])
const state = reactive({
  loading: false,
  dialogVisible: false,
  doc: {},
  title: 'filePopover_internalShare'
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data) return
    state.loading = true
    const result = { ...data }
    if (result.time === 'permanent') {
      delete result.startDate
      delete result.endDate
    } else {
      result.startDate = result.dateRange[0]
      result.endDate = result.dateRange[1]
    }
    delete result.dateRange
    delete result.time
    delete result.ids
    result.isSendEmail = result.isSendEmail.length > 0
    result.documentIds = [state.doc.id]
    await createInternalShare(result, handleCloseDialog)
  } catch (error) {

  } finally {
    state.loading = false
  }
}

const handleCloseDialog = (closeDialog: boolean = true) => {
  state.dialogVisible = !closeDialog
  state.loading = false
  if (closeDialog) FormRendererRef.value.vFormRenderRef.resetForm()
}

function handleOpen(docDetail) {
  state.doc = docDetail
  state.dialogVisible = true
  const params = {
    permission: docDetail.permission || '',
    ids: []
  }
  nextTick(() => {
    FormRendererRef.value.vFormRenderRef.setFormData(params)
  })
}

// #region module: internal share
function handleInternalShare(docDetail) {
  handleOpen({
    ...docDetail,
    permission: 'ReadWrite'
  })
}

async function createInternalShare(formData, cb) {
  try {
    await newClientApi.postDmsInternalshare(formData).then(r => r.data)
    cb()
  } catch (error) {
    cb(false)
  }
}

// #endregion

defineExpose({
  handleOpen
})
onMounted(async () => {
  useEventListener(document, 'docActionInternalShare', (event) => handleInternalShare(event.detail))
})
</script>

<style lang="scss" scoped>
.el-select, .el-radio-group, .el-date-editor.el-input {
  width: 100%
}

:deep(.el-date-editor) {
  width: 100%;

  .el-range-separator {
    width: 2rem;
  }
}
</style>
