<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.maxValue')">
      <el-input v-model="formData.max" type="number" />
    </el-form-item>
    <el-form-item :label="t('mdTable.addColumnField.allowHalf')">
      <el-switch v-model="formData.allowHalf" />
    </el-form-item>
    <el-form-item v-if="formData.max" :label="t('mdTable.addColumnField.defaultValue')">
      <el-rate v-model="formData.defaultValue" :max="Number(formData.max)" :allow-half="formData.allowHalf" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()
</script>
