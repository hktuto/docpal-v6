<script setup lang="ts">
const form = defineModel<any>('form')
const { t } = useI18n()

const step = computed(() => {
  if (!!form.value.validation?.decimal_places) {
    return 10 ** -form.value.validation.decimal_places
  }
  return 1
})
</script>

<template>
<!--  <el-form-item label="Default Value">-->
<!--    <el-input-number v-model="form.default_value" :min="form.validation.min_value" :max="form.validation.max_value" :step="step" />-->
<!--  </el-form-item>-->
  <el-form-item :label="t('metadata.validation.number.minimum')" prop="minimum">
    <el-input-number v-model="form.validation.min_value" :placeholder="t('metadata.validation.number.minimum')" />
  </el-form-item>

  <el-form-item :label="t('metadata.validation.number.maximum')" prop="maximum">
    <el-input-number v-model="form.validation.max_value" :placeholder="t('metadata.validation.number.maximum')" />
  </el-form-item>

  <el-form-item :label="t('metadata.validation.number.precision')" prop="decimal_places">
    <el-input-number v-model="form.validation.decimal_places" :placeholder="t('metadata.validation.number.precision')" :min="0" :max="10" />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
