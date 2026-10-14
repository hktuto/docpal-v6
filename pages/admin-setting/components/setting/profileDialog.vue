<script setup lang="ts">
const { t } = useI18n()
const formRef = ref()
const emits = defineEmits(['save', 'update'])
const visible = ref<boolean>(false)
const formData = reactive({
  key: '',
  allowUserEdit: true,
  display: true,
  label: '',
  readyOnly: true,
  type: 'string'
})
const rules = reactive({
  label: [
    {
      required: true,
      message: t('render.hint.fieldRequired', { name: t('table_label') }),
      trigger: 'blur'
    }
  ]
})
const isEdit = ref(false)

function open(item?: any) {
  isEdit.value = false
  visible.value = true
  if (!!item) {
    isEdit.value = true
    formData.key = item.key
    formData.label = item.label
    formData.allowUserEdit = item.allowUserEdit
    formData.display = item.display
    formData.readyOnly = item.readyOnly
    formData.type = item.type
  }
}

async function saveField() {
  try {
    await formRef.value.validate()
    if (isEdit.value) {
      emits('update', formData)
    } else {
      emits('save', formData)
    }
    visible.value = false
  } catch (e) {
    console.error(e)
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="t('user.setting.editField')">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="t('table_label')" prop="label">
        <el-input v-model="formData.label" />
      </el-form-item>

      <el-form-item :label="t('user.setting.allowUserEdit')">
        <el-switch v-model="formData.allowUserEdit" />
      </el-form-item>

      <el-form-item :label="t('user.setting.readyOnly')">
        <el-switch v-model="formData.readyOnly" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="UserProfileView__Dialog__Save" type="primary" @click="saveField">
        {{ $t('common_save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
