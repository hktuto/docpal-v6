<script setup lang="ts">
const form = defineModel<any>('form')
const { t } = useI18n()
</script>

<template>
<!--  <el-form-item label="Default Value">-->
<!--    <el-date-picker v-model="form.default_value" type="datetime" placeholder="Select date and time" :format="form.validation.pattern" />-->
<!--  </el-form-item>-->

  <el-form-item :label="t('metadata.validation.date.format')" prop="format">
    <el-select
      v-model="form.validation.pattern"
      :placeholder="t('metadata.validation.date.format')"
      filterable
      default-first-option
      class="date-format-select"
    >
      <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
      <el-option label="YYYY-MM-DD HH:mm" value="YYYY-MM-DD HH:mm" />
      <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
      <el-option label="YYYY-MM-DDTHH:mm:ss.000Z" value="YYYY-MM-DDTHH:mm:ss.000Z" />
      <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
      <el-option label="YYYY/MM/DD HH:mm" value="YYYY/MM/DD HH:mm" />
      <el-option label="YYYY/MM/DD HH:mm:ss" value="YYYY/MM/DD HH:mm:ss" />
      <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
      <el-option label="DD/MM/YYYY HH:mm" value="DD/MM/YYYY HH:mm" />
      <el-option label="DD/MM/YYYY HH:mm:ss" value="DD/MM/YYYY HH:mm:ss" />
    </el-select>
  </el-form-item>
</template>

<style scoped lang="scss">
.date-default-value-select {
  margin-bottom: var(--app-space-xs);
}
</style>
