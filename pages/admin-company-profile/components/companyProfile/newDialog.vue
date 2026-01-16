<template>
  <el-dialog v-model="state.visible" :title="$t('companyProfile.create')" class="scroll-dialog" append-to-body
             :close-on-click-modal="false" destroy-on-close>
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button id="CompanyProfile__NewProfile__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './newDialog.vform.json'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const emits = defineEmits(['refresh'])
const state = reactive({
  loading: false,
  visible: false,
  setting: {}
})

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    data.status = data.status ? 'A' : 'D'
    state.loading = true
    const result = await clientApi.api.postDmsCompanyprofiles(data).then(r => r.data)
    ElMessage.success(t('tip_createdSuccessMsg', { modelName: t('companyProfile.name'), name: null }))
    state.visible = false
    emits('refresh')
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.visible = true
  setTimeout(async () => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
