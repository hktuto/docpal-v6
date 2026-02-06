<script lang="ts" setup>
import formJson from './capture.vform.json'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const props = defineProps<{
  id: string
  settings: any
  storageId: string
}>()
const emits = defineEmits(['update'])
const loading = ref(false)
const FormRendererRef = ref()

async function handleSave() {
  try {
    const data = await FormRendererRef.value.getFormData()
    loading.value = true
    const params = {
      use_document_type: data.use_document_type
    }
    if (data.use_document_type) {
      params.document_type = data.document_type
      params.need_confirm = data.need_confirm
      params.confirm_user = data.confirm_user.filter((item: any) => !item.includes('group&&&&'))
      params.confirm_group = data.confirm_user.filter((item: any) => item.includes('group&&&&')).map((item: any) => item.replace('group&&&&', ''))
    }
    await newAdminApi.patchExt3rdstorageIdProfilesProfileidUpdateCapture(props.storageId, props.id, params).then(r => r.data)
    ElMessage.success(t('dpMsg_success'))
    emits('update')
  } catch (error: any) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.settings, (newVal) => {
  if (newVal) {
    const data = {
      use_document_type: newVal.use_document_type
    }
    if (newVal.use_document_type) {
      data.need_confirm = newVal.need_confirm
      data.document_type = newVal.document_type
      let confirmUser = []
      let confirmGroup = []
      if (newVal.confirm_user) {
        confirmUser = newVal.confirm_user
      }
      if (newVal.confirm_group) {
        confirmGroup = newVal.confirm_group.map((item: any) => 'group&&&&' + item)
      }
      data.confirm_user = [...confirmUser, ...confirmGroup]
    }
    FormRendererRef.value.vFormRenderRef.setFormData(data)
  }
})
</script>
<template>
  <div class="container">
    <FormRenderer ref="FormRendererRef" :form-json="formJson"/>
    <div style="width: 100%; text-align: right">
      <el-button :loading="loading" type="primary" @click="handleSave">{{ $t('button.save') }}</el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  height: 100%;
  overflow: auto;
  padding: var(--app-space-s);
}
</style>
