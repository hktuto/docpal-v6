<template>
  <el-dialog
    class="scroll-dialog big"
    v-model="state.visible" :title="state.isEdit ? $t('holdPolicies.edit') : $t('holdPolicies.create')"
    :close-on-click-modal="false" append-to-body
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson">
    </FormRenderer>
    <template #footer>
      <el-button id="HoldPolicySetting__CreateNewHoldPolicy__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from './dialog.vform.json'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits([
  'update'
])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  isEdit: false
})
const router = useRouter()
const form = reactive({
  labelRule: []
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    const params = {
      ...state.setting,
      ...data
    }
    state.loading = true
    let msg
    if (state.isEdit) {
      await newAdminApi.putDmsPolicyHold(params)
      msg = t('tip_updateMsg', { modelName: t('workflow_holdPolicy'), name: null })
    } else {
      await newAdminApi.postDmsPolicyHold(params)
      msg = t('tip_createdMsg', { modelName: t('tip_newMsg') + t('workflow_holdPolicy'), name: null })
    }
    ElMessage.success(msg)
    state.visible = false
    emits('update')
  } catch (error) {
    console.log(error)
  }
  state.loading = false
}

async function handleOpen(setting) {
  state.visible = true
  setTimeout(async () => {
    await FormRendererRef.value.vFormRenderRef.resetForm()
    if (setting && setting.isEdit) {
      state.isEdit = true
      state.setting = setting
      await FormRendererRef.value.vFormRenderRef.setFormData({ ...state.setting })
      state.loading = false
    } else {
      state.isEdit = false
      state.setting = {}
    }
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
