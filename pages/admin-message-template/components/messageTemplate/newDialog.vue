<script setup lang="ts">
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
const { t } = useI18n()
const dialogVisible = ref(false)

const emits = defineEmits(['close', 'success'])
const newForm = ref({
  name: '',
  header: '',
  body: '',
  bodyParameters: [],
  footer: '',
  textMessage: '',
  confirmButtonName: '',
  language: 'en_US'
})

function open() {
  reset()
  dialogVisible.value = true
}

function reset() {
  newForm.value = {
    name: '',
    header: '',
    body: '',
    bodyParameters: [],
    footer: '',
    textMessage: '',
    confirmButtonName: '',
    language: 'en_US'
  }
}

async function submit() {
  if (newForm.value.name.trim() === '') return
  const res = await clientApi.admin.postAdmindocpalMessageTemplateCreate(newForm.value)
  ElMessage.success(t('tip_createdSuccessMsg', { modelName: t('adminMenu.messageTemplate'), name: null }))
  emits('success', res.data)
  dialogVisible.value = false
}

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="dialogVisible" append-to-body :title="$t('messageTemplate_Create')">
    <ElForm :model="newForm" label-position="top">
      <ElFormItem label="Name">
        <ElInput v-model="newForm.name" placeholder="Name" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton id="MessageTemplate__NewTemplate__Reset" @click="reset">{{ $t('common_reset') }}</ElButton>
      <ElButton id="MessageTemplate__NewTemplate__Submit" type="primary" @click="submit">{{ $t('common_submit') }} </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss"></style>
