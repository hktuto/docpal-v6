<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.iconForTrue')">
      <UiIconPicker v-model="formData.icon" @change="handleIconChange" />
    </el-form-item>
    <el-form-item :label="t('mdTable.addColumnField.defaultValue')" prop="defaultValue">
      <el-switch v-model="formData.defaultValue" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()

if (props.formData.defaultValue === undefined) {
  props.formData.defaultValue = false
}
</script>
