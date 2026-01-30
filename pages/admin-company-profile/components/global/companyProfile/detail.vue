<script lang="ts" setup>
import { onMounted } from 'vue'
import formJson from '../../companyProfile/newDialog.vform.json'
import { clientApi } from 'api'

const props = defineProps<{
  id: string
}>()
const loading = ref(false)
const FormRendererRef = ref()
const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)

async function handleSave() {
  try {
    const data = await FormRendererRef.value.getFormData()
    data.status = data.status ? 'A' : 'D'
    loading.value = true
    const result = await clientApi.admin.putAdmindmsCompanyprofilesCompanyid(props.id, data).then(r => r.data)
    if (result) routerProvider?.message.success(t('dpMsg_success'))
  } catch (error: any) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function init() {
  try {
    loading.value = true
    const data: any = await clientApi.admin.getAdmindmsCompanyprofilesCompanyid(props.id).then((res) => res.data)
    setTimeout(() => {
      FormRendererRef.value.vFormRenderRef.setFormData({ ...data, status: data.status === 'A' })
    })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  init()
})
</script>
<template>
  <div class="container">
    <FormRenderer ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <div style="width: 100%; text-align: right">
      <el-button :loading="loading" type="primary" @click="handleSave">{{ $t('button.save') }}</el-button>
    </div>
    <el-divider />
    <CompanyProfileChopsTable style="height: 60vh" v-bind="props" />
  </div>
</template>
<style lang="scss" scoped>
.container {
  height: 100%;
  overflow: auto;
  padding: var(--app-space-s);
}
</style>
