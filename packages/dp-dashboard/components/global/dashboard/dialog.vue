<template>
  <el-dialog v-model="state.visible" :title="title" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="Dashboard__CreateNewDashboard__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import formJson from './dialog.vform.json'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['refresh', 'add'])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  edit: false
})
const FormRendererRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    const _data = {
      name: data.name,
      access: data.access.join(',')
    }
    if (state.edit) {
      const res = await newClientApi.putDsbUserDashboards({
        ...state.setting,
        ..._data
      })
      ElMessage.success(
        t('tip_updateMsg', {
          modelName: null,
          name: _data.name
        })
      )
      emits('refresh')
    } else {
      const res = await newClientApi.postDsbUserDashboards(_data)
      ElMessage.success(t('tip_createdMsg', {
        modelName: t('tip_newMsg') + t('dashboard.PersonalDashboard'),
        name: _data.name
      }))
      // router.push(`/data-dashboard/${res.id}`)
      emits('add', res.data)
    }
    state.visible = false
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }
}

let title = t('dashboard_create')

function handleOpen(setting?: any) {
  state.visible = true
  state.edit = false
  if (!setting) {
    title = t('dashboard_create')
    setTimeout(async () => {
      FormRendererRef.value.vFormRenderRef.resetForm()
    })
    return
  }
  title = t('dashboard_edit')
  setTimeout(async () => {
    const _setting = deepCopy(setting)
    state.edit = _setting.edit = true
    state.setting = _setting
    if (_setting.access) _setting.access = _setting.access.split(',')
    else _setting.access = []
    await FormRendererRef.value.vFormRenderRef.setFormData({
      ..._setting
    })
    state.loading = false
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
