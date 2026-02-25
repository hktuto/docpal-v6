<template>
  <el-dialog
    class="scroll-dialog retention-add-dialog big"
    v-model="state.visible" :title="t('filePolicies_RetentionPolicyCreate')"
    :close-on-click-modal="false" append-to-body
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <template #footer>
      <el-button id="RetentionPolicySetting__CreateNewRetentionPolicy__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from './addDialog.vform.json'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const emits = defineEmits([
  'update'
])
const state = reactive({
  loading: false,
  visible: false,
  setting: {}
})

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    console.log(data)
    const params = {
      ...state.setting,
      ...data,
      actionType: data.actionType ? 'D' : 'A'
    }
    state.loading = true
    await newAdminApi.postDmsPolicyRetention(params).then(r => r.data)
    ElMessage.success(t('tip_createdMsg', {
      modelName: t('tip_newMsg') + t('filePolicies_RetentionPolicy'),
      name: null
    }))
    state.visible = false
    emits('update')
  } catch (error) {
    console.log(error)
  }
  state.loading = false
}

async function handleOpen() {
  state.visible = true
  setTimeout(async () => {
    await FormRendererRef.value.vFormRenderRef.resetForm()
    state.setting = {}
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss">

</style>
