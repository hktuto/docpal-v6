<template>
  <el-dialog v-model="state.visible" :title="$t('actions.duplicate')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="WorkPanel__CreateNewWorkPanel__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from './dialog.vform.json'
import { ElMessage } from 'element-plus'
const emits = defineEmits(['refresh', 'delete', 'add'])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  setting: {}
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    state.loading = true
    const data = await FormRendererRef.value.getFormData()
    const _data = {
      name: data.name,
      groupId: data.groupId.join(',')
    }

    const res = await clientApi.admin
      .postAdmindocpalPersonalDashboardSave({
        ..._data,
        styleJson: state.setting.styleJson
      })
      .then((res) => res.data)
    ElMessage.success(
      t('tip_createdMsg', {
        modelName: t('tip_newMsg') + t('workPanel_workPanel'),
        name: _data.name
      })
    )
    emits('add', res)
    state.visible = false
  } catch (error) {
  } finally {
    state.loading = false
  }
}

function handleOpen(setting: any) {
  state.visible = true
  const _setting = deepCopy(setting)
  nextTick(async () => {
    state.setting = _setting
    if (_setting.groupId) _setting.groupId = _setting.groupId.split(',')
    else _setting.groupId = []
    await FormRendererRef.value.vFormRenderRef.setFormData({
      ..._setting
    })
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
