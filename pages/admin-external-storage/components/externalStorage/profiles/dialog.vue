<template>
  <el-dialog
    v-model="state.visible"
    :title="state.isEdit ? $t('externalStorage.editConnection') : $t('externalStorage.create')"
    class="scroll-dialog externalStorage-profiles-dialog"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button id="ExternalStorage__Detail__Create__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './dialog.vform.json'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'

const props = defineProps(['id'])
const { t } = useI18n()
const emits = defineEmits(['refresh'])
const state = reactive<any>({
  isEdit: false,
  loading: false,
  visible: false,
  setting: {}
})

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    await newAdminApi.postExt3rdstorageIdProfiles(props.id, data).then(r => r.data)
    ElMessage.success(t('dpMsg_success'))
    state.visible = false
    await new Promise(resolve => setTimeout(resolve, 500))
    emits('refresh')
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.visible = true
  state.isEdit = false
  state.setting = {}
  setTimeout(async () => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
