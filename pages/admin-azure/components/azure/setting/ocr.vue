<template>
  <div>
    <div class="title">{{ $t('azure.ocrSetting') }}</div>
    <div class="description">{{ $t('azure.ocrSettingDescription') }}</div>
    <el-card>
      <FormRenderer ref="FormRendererRef" :form-json="formJson">
        <template v-slot:button>
          <el-button type="info" @click="handleEditEmailTemplate">{{ $t('emailTemplate.edit') }}</el-button>
        </template>
      </FormRenderer>
      <el-button class="p-btn" type="primary" :loading="state.loading" @click="handleSave">{{ $t('common_save') }} </el-button>
    </el-card>
    <EmailTemplateReader ref="emailTemplateEditor"></EmailTemplateReader>
  </div>
</template>
<script setup lang="ts">
import formJson from './ocr.vform.json'
const routerProvider = inject(MenuRouterKey)
const azureProvider = inject(AzureProviderKey)
const props = defineProps(['setting'])
const state = reactive<any>({
  loading: false
})
const { t } = useI18n()
const FormRendererRef = ref()

async function handleSave() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    const result = await azureProvider?.UpdateAzureOcrSettingApi({
      ...data,
      alertEmail: data.alertEmail.join(',')
    })
    if (result) routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    setTimeout(() => (state.loading = false), 500)
  }
}

function initForm(setting: any) {
  if (!setting.alertEmail) return
  setting.alertEmail = setting.alertEmail.split(',')

  FormRendererRef.value.vFormRenderRef.setFormData(setting)
}

const emailTemplateEditor = ref()

async function handleEditEmailTemplate() {
  try {
    const data = await FormRendererRef.value.getFormData(false)
    if (!data.emailTemplate) throw new Error('')
    emailTemplateEditor.value.handleOpen(data.emailTemplate, true)
  } catch (error) {
    routerProvider?.message.error(t('tip.emailTemplateMissing'))
  }
}

watch(
  () => props.setting,
  (newVal) => {
    setTimeout(() => initForm({ ...newVal }))
  },
  {
    immediate: true
  }
)
</script>
<style lang="scss" scoped>
.title {
  font-weight: bold;
  font-size: var(--app-font-size-l);
}

.description {
  line-height: var(--app-font-size-xl);
  color: var(--app-grey-950);
}

.el-input {
  width: 100%;
  padding: var(--app-space-xs) 0;
}

.el-card {
  position: relative;

  .p-btn {
    position: absolute;
    right: var(--app-space-xs);
    top: var(--app-space-xs);
  }
}
</style>
