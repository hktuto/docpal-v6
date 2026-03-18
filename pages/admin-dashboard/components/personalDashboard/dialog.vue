<template>
  <el-dialog v-model="state.visible" :title="title" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="browseHome__CreateNewWorkPanel__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from './dialog.vform.json'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['refresh', 'delete', 'add'])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  edit: false
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
    if (state.edit) {
      await newAdminApi.putDocpalPersonalDashboardUpdate({
        ...state.setting,
        ..._data
      })
        .then((r) => r.data)
      ElMessage.success(
        t('tip_updateMsg', {
          modelName: t('workPanel_workPanel'),
          name: _data.name
        })
      )
      emits('refresh')
    } else {
      const res = await newAdminApi.postDocpalPersonalDashboardSave({
        ..._data,
        styleJson: '{}'
      })
        .then((res) => res.data)
      ElMessage.success(
        t('tip_createdMsg', {
          modelName: t('tip_newMsg') + t('workPanel_workPanel'),
          name: _data.name
        })
      )
      emits('add', res)
    }
    state.visible = false
  } catch (error) {
  } finally {
    state.loading = false
  }
}

let title = t('workPanel_create')

function handleOpen(setting?: any) {
  state.visible = true
  state.edit = false
  if (!setting) {
    title = t('workPanel_create')
    nextTick(async () => {
      FormRendererRef.value.vFormRenderRef.resetForm()
    })
    return
  }
  title = t('workPanel_edit')
  const _setting = deepCopy(setting)
  state.edit = _setting.edit = true
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
