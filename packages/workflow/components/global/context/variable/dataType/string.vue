<script setup lang="ts">
const form = defineModel<any>('form')
const { t } = useI18n()

function handleMaxLength(number) {
  if (!number) {
    form.value.validation.max_length = 255
  }
}
</script>

<template>
<!--  <el-form-item label="Default Value">-->
<!--    <el-input v-model="form.default_value" />-->
<!--  </el-form-item>-->
  <el-form-item v-if="form.display_type === 'text'" :label="t('metadata.validation.text.maxLength')">
    <el-input-number
      v-model="form.validation.max_length"
      :placeholder="t('metadata.validation.text.maxLength')"
      :max="4000"
      :min="1"
      @change="handleMaxLength"
    />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
