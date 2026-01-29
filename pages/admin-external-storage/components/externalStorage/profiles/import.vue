<script lang="ts" setup>
import formJson from './import.vform.json'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const props = defineProps<{
  id: string
  storageId: string
  settings: any
}>()
const emits = defineEmits(['update'])
const loading = ref(false)
const FormRendererRef = ref()

async function handleSave() {
  try {
    const data = await FormRendererRef.value.getFormData()
    loading.value = true
    await clientApi.admin.patchAdminext3rdstorageIdProfilesProfileidUpdateImport(props.storageId, props.id, data).then(r => r.data)
    ElMessage.success(t('dpMsg_success'))
    emits('update')
  } catch (error: any) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.settings, (newVal) => {
  if (newVal) {
    // normalize newVal processingFolder, finishFolder, errorFolder
    const params = {
      ...newVal,
      processing_folder: newVal.processing_folder || '/processing',
      finish_folder: newVal.finish_folder || '/finish',
      error_folder: newVal.error_folder || '/error',
      file_type: newVal.file_type || '',
      include_folder: newVal.include_folder || true,
      path: newVal.path || '/'
    }
    FormRendererRef.value.vFormRenderRef.setFormData(params)
  }
})
</script>
<template>
  <div class="container">
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <div style="width: 100%; text-align: right">
      <el-button :loading="loading" type="primary" @click="handleSave">{{ $t('button.save') }}</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  height: 100%;
  overflow: auto;
  padding: var(--app-space-s);
}
</style>
