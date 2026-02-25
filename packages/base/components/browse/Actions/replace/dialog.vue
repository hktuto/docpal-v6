<template>
  <el-dialog v-model="state.visible"
             class="scroll-dialog replace-dialog"
             :title="$t('replaceFile')"
             :close-on-click-modal="false"
             append-to-body
  >
    <el-form ref="formRef" :model="form" label-position="top" @submit.native.prevent>
      <el-form-item :label="$t('common_file')" prop="targetFile"
                    :rules="[{ required: true, message: $t('common_file') + $t('render.hint.fieldRequired')}]">
        <FormUpload v-model="form.fileList" :limit="1"></FormUpload>
      </el-form-item>
      <el-checkbox v-if="checkLicenseFeatures('AI_CLASSIFICATION')" v-model="form.openAiAnalyzeMetadata">
        {{ $t('ai.checkAI') }}
      </el-checkbox>
    </el-form>
    <template #footer>
      <el-button style="width: 100%" type="primary" :loading="state.loading" @click="handleConfirm">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const emits = defineEmits([
  'update'
])
const state = reactive({
  loading: false,
  visible: false,
  doc: {}
})
const form = ref<any>({
  fileList: [],
  // languages: ['eng'],
  openAiAnalyzeMetadata: true
})
const formRef = ref()

async function handleConfirm() {
  if (form.value.fileList.length === 0) {
    state.visible = false
    return
  }
  const d = {
    idOrPath: state.doc.id
    // languages: form.value.languages
  }
  const formData = new FormData()
  formData.append('file', form.value.fileList[0])
  formData.append('document', JSON.stringify(d))
  formData.append('openAiAnalyzeMetadata', form.value.openAiAnalyzeMetadata)
  state.loading = true
  try {
    await newClientApi.patchDmsDocumentContent(formData).then(r => r.data)
    state.visible = false
    form.value = {
      fileList: [],
      // languages: ['eng'],
      openAiAnalyzeMetadata: true
    }
    emits('update')
  } catch (error) {

  }
  state.loading = false
}

function handleOpen(doc) {
  state.visible = true
  state.doc = doc
}

defineExpose({ handleOpen })
</script>
<style lang="scss">
.replace-dialog {
  width: 400px !important;
}

.upload-demo {
  width: 100%
}
</style>
