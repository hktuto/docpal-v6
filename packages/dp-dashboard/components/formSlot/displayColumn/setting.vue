<template>
  <el-dialog v-model="state.visible" :title="$t('dpTable.columnSetting')" class="scroll-dialog" destroy-on-close append-to-body :close-on-click-modal="false" @close="handleClose">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="Dashboard__CreateNewDashboard__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './setting.vform.json'
const emits = defineEmits(['refresh', 'add'])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  edit: false
})
const FormRendererRef = ref()
function filterObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([key, value]) => value !== undefined && value !== null && value !== ''))
}
async function handleSubmit() {
  const data = await FormRendererRef.value.getFormData()
  const _data = { ...state.setting, ...data }
  emits('refresh', filterObject(_data))
  state.visible = false
}

function handleOpen(setting?: any) {
  state.visible = true
  setTimeout(async () => {
    state.setting = setting
    await FormRendererRef.value.vFormRenderRef.setFormData(setting)
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
