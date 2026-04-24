<script setup lang="ts">
const form = defineModel<any>('form')
const { t } = useI18n()
const multipleOfRules = [
  {
    required: true,
    message: t('render.hint.fieldRequired', { name: t('metadata.validation.number.multipleOf') }),
    trigger: 'blur'
  }
]
</script>

<template>
  <el-form-item :label="t('metadata.validation.number.minimum')" prop="minimum">
    <el-input-number v-model="form.minimum" :placeholder="t('metadata.validation.number.minimum')" />
  </el-form-item>

  <el-form-item :label="t('metadata.validation.number.maximum')" prop="maximum">
    <el-input-number v-model="form.maximum" :placeholder="t('metadata.validation.number.maximum')" />
  </el-form-item>

  <el-form-item :label="t('metadata.validation.number.multipleOf')" prop="multipleOf" :rules="multipleOfRules">
    <el-input-number v-model="form.multipleOf" :placeholder="t('metadata.validation.number.multipleOf')" :min="0" :max="1000000" :step="0.01" />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
