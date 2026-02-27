<template>
  <el-dialog v-model="state.visible"
             :title="state.edit ? $t('emailContentTemplate_layoutEdit') : $t('emailContentTemplate_layoutCreate')"
             :close-on-click-modal="false"
             @close="handleClose"
             class="scroll-dialog"
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <div class="footer-grid">
        <!-- Please use [[emailContent]] as content container. -->
        <div>{{ $t('tip.emailLayout') }}</div>
        <el-button id="EmailContentTemplate__CreateNewEmailLayout__InitEmailLayout" type="info" @click="handleInit">
          {{ $t('emailTemplate.initLayout') }}
        </el-button>
        <el-button id="EmailContentTemplate__CreateNewEmailLayout__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { globalApi } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'
import formJson from './dialog.vform.json'

const { t } = useI18n()
const emits = defineEmits([
  'refresh'
])
const state = reactive({
  loading: false,
  visible: false,
  edit: false,
  setting: {},
  initLayout: '<!DOCTYPEhtml>\n<html>\n<title>WCLEmailTemplate</title>\n<head></head>\n<style>\nbody \n{\n  width: 100%;\n  font-size: 11px;\n}\nh1,h2,h3,h4,h5 {\n   font-size: 1.2rem;\n}\n.copy-right {\n  font-size: 8px;\n}\n</style>\n<body>\n<h1>WCLEmailTemplateLogo.</h1>\n<center>[[emailContent]]</center>\n<center class="copy-right">Copyright © 2008 - 2024 DocPal All Rights Reserved.</center>\n</body>\n</html>'
})
const FormRendererRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    let msg
    if (state.edit) {
      data.id = state.setting.id
      await globalApi.putDmsTemplateEmailLayout(data)
      msg = t('tip_updateMsg', { modelName: null, name: data.name })
    } else {
      await globalApi.postDmsTemplateEmailLayout(data)
      msg = t('tip_createdMsg', { modelName: null, name: data.name })
    }
    ElMessage.success(msg)
    emits('refresh')
    state.visible = false
  } catch (error) {
    state.loading = false
  }
  state.loading = false
}

function handleClose() {
  FormRendererRef.value.vFormRenderRef.resetForm()
  const layoutRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('layoutContent')
  layoutRef.setValue(state.initLayout)
}

function handleOpen(setting) {
  state.visible = true
  state.edit = !!setting
  setTimeout(async () => {
    state.setting = setting
    await FormRendererRef.value.vFormRenderRef.setFormData(setting)
    state.loading = false
  })
}

async function handleInit() {
  const layoutRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('layoutContent')
  const layoutContent = layoutRef.getValue()
  let action = 'confirm'
  if (layoutContent) action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToInit')}`).catch(action => action)
  if (action !== 'confirm') return
  layoutRef.setValue(state.initLayout)
}

onMounted(async () => {
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.footer-grid {
  display: grid;
  grid-template-columns: 1fr min-content min-content;
  text-align: left;
}
</style>
