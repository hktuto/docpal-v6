<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.maxValue')">
      <el-input v-model="formData.max" type="number" />
    </el-form-item>
    <el-form-item :label="t('mdTable.addColumnField.allowHalf')">
      <el-switch v-model="formData.allowHalf" />
    </el-form-item>
    <el-form-item v-if="formData.max" :label="t('mdTable.addColumnField.defaultValue')" prop="defaultValue">
      <el-rate v-model="formData.defaultValue" :max="Number(formData.max)" :allow-half="formData.allowHalf" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()

if (props.formData.max === undefined) {
  props.formData.max = 5
}

if (props.formData.defaultValue === undefined) {
  props.formData.defaultValue = 0
}
</script>
