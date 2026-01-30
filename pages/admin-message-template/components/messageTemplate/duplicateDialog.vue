<script setup lang="ts">
import { clientApi } from 'api'
import { ElNotification } from 'element-plus'

const dialogVisible = ref(false)

const emits = defineEmits(['success'])
const newTempalteName = ref('')
const oldTemplate = ref()
const { t } = useI18n()

async function getOldTemplate(row: any) {
  const res = await clientApi.admin.getAdmindocpalMessageTemplateDetailsId(row.id)
  oldTemplate.value = res.data
}

async function open(row: any) {
  await getOldTemplate(row)
  dialogVisible.value = true
}

async function submit() {
  if (newTempalteName.value.trim() === '') return
  const newTemplate = {
    ...oldTemplate.value,
    name: newTempalteName.value
  }
  const res = await adminApi.api.postMessageTemplateCreateMessageTemplate(newTemplate)
  ElNotification.success('Success')
  emits('success', res.data)
  dialogVisible.value = false
}

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="dialogVisible" append-to-body>
    <ElForm :model="newTempalteName" label-position="top">
      <ElFormItem label="Name">
        <ElInput v-model="newTempalteName" clearable placeholder="Name" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <span class="dialog-footer">
        <ElButton id="MessageTemplate__Detail__Duplicate__Submit" type="primary" @click="submit">
          {{ t('common_submit') }}
        </ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss"></style>
