<template>
  <el-dialog v-model="state.visible" :title="$t('easyForm_createForm')" class="scroll-dialog" append-to-body :close-on-click-modal="false" destroy-on-close>
    <FormRenderer ref="FormRendererRef" :form-json="formJson"> </FormRenderer>
    <template #footer>
      <div class="footer-grid">
        <el-button id="EasyForm__CreateNewForm__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './newDialog.vform.json'
import { newAdminApi } from 'api'
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
    state.loading = true
    data.permission = 'group_members'
    await newAdminApi.postDmsEasyForm(data).then(r => r.data)
    ElMessage.success(t('tip_createdMsg', { modelName: t('tip_newMsg') + t('workflow_form'), name: null }))
    state.visible = false
    emits('refresh')
  } catch (error) {
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
