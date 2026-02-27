<template>
  <div>
    <div class="title">{{ $t('azure.apiSetting') }}</div>
    <div class="description">{{ $t('azure.apiSettingDescription') }}</div>
    <el-card>
      <FormRenderer ref="FormRendererRef" :form-json="formJson"> </FormRenderer>
      <el-button class="p-btn" type="primary" :loading="state.loading" @click="handleSave">{{ $t('common_save') }} </el-button>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import formJson from './api.vform.json'
import { AzureProviderKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const props = defineProps(['setting'])
const { t } = useI18n()
const state = reactive<any>({
  loading: false
})
const azureProvider = inject(AzureProviderKey)
const route = useRoute()
const FormRendererRef = ref()

async function handleSave() {
  try {
    state.loading = true
    const data = await FormRendererRef.value.getFormData()
    const params: any = {
      description: data.description
    }
    if (!data.apiKey.includes('....')) params.apiKey = data.apiKey
    const result = await azureProvider?.UpdateAzureApiKeyApi({
      ...params
    })
    if (result) routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  } finally {
    setTimeout(() => (state.loading = false), 500)
  }
}

function initForm(setting) {
  FormRendererRef.value.vFormRenderRef.setFormData(setting)
}

watch(
  () => props.setting,
  (newVal) => {
    if (!newVal) return
    setTimeout(() => initForm(newVal))
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
  line-height: 32px;
  color: var(--app-grey-950);
}

.el-input {
  width: 100%;
  padding: var(--app-space-xs) 0;
}

.el-card {
  position: relative;

  :deep(.p-btn ){
    position: absolute;
    right: var(--app-space-xs);
    top: var(--app-space-xs);
  }
}
</style>
