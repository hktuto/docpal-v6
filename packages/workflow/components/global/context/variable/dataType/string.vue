<script setup lang="ts">
const form = defineModel<any>('form')

const { t } = useI18n()
const rules = [
  {
    required: true,
    message: t('render.hint.fieldRequired', { name: t('metadata.validation.text.maxLength') }),
    trigger: 'blur'
  }
]
</script>

<template>
  <el-form-item v-if="form.tag === 'text'" :label="t('metadata.validation.text.maxLength')" prop="maxLength" :rules="rules">
    <el-input-number v-model="form.maxLength" :placeholder="t('metadata.validation.text.maxLength')" :max="4000" :min="1" />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
