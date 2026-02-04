<template>
  <el-dialog v-model="state.visible" :title="$t('docType.duplicate')" class="scroll-dialog" append-to-body
             :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'
import formJson from './duplicate.vform.json'

const emits = defineEmits(['refresh', 'delete'])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  setting: {} as any
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    const params = {
      name: data.name,
      id: state.setting.id
      // category: state.setting.category,
      // isFolder: state.setting.isFolder === 'false' ? false : true,
    }
    await newAdminApi.postDmsDocpalTypeDuplicate(params).then(r => r.data)
    ElMessage.success(t('metadata.duplicate_success', { name: data.name }))
    emits('refresh')
    state.visible = false
  } catch (error) {
    console.error(error)
    ElMessage.error(t('metadata.duplicate_error'))
  } finally {
    state.loading = false
  }
}

function handleOpen(setting) {
  state.visible = true

  setTimeout(async () => {
    state.setting = setting
    await FormRendererRef.value.vFormRenderRef.setFormData({
      fromName: setting.name,
      name: ''
    })
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
