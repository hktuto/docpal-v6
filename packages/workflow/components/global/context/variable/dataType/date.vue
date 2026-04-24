<script setup lang="ts">
const form = defineModel<any>('form')
const { t } = useI18n()
// Initialize default values if not exists
if (!form.dateOrDateTime) {
  form.dateOrDateTime = 'date'
}
if (!form.format) {
  form.format = 'YYYY-MM-DD'
}
if (!form.isMultiple) {
  form.isMultiple = false
}

const formatRules = [
  {
    required: true,
    message: t('render.hint.fieldRequired', { name: t('metadata.validation.date.format') }),
    trigger: 'blur'
  }
]

const defaultValueType = ref<'none' | 'special' | 'date'>('none')

// Watch for changes in defaultValueType to handle the validation.defaultValue
watch(defaultValueType, (newType) => {
  if (newType === 'none') {
    form.defaultValue = undefined
  }
})
</script>

<template>
  <el-form-item :label="t('metadata.validation.date.dateOrDateTime')" prop="dateOrDateTime">
    <el-select v-model="form.dateOrDateTime" :placeholder="t('metadata.validation.date.dateOrDateTime')">
      <el-option label="Date" value="date" />
      <el-option label="Date Time" value="dateTime" />
    </el-select>
  </el-form-item>

  <el-form-item :label="t('metadata.validation.date.format')" prop="format" :rules="formatRules">
    <el-select
      v-model="form.format"
      :placeholder="t('metadata.validation.date.format')"
      clearable
      filterable
      allow-create
      default-first-option
      class="date-format-select"
    >
      <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
      <el-option label="YYYY-MM-DD HH:mm" value="YYYY-MM-DD HH:mm" />
      <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
      <el-option label="YYYY-MM-DDTHH:mm:ss.000Z" value="YYYY-MM-DDTHH:mm:ss.000Z" />
      <el-option label="YYYY/MM/DD" value="YYYY/MM/DD" />
    </el-select>
  </el-form-item>

  <el-form-item :label="t('metadata.validation.date.defaultValue')" prop="defaultValue">
    <el-select v-model="defaultValueType" class="date-default-value-select" :placeholder="t('metadata.validation.date.defaultValue')">
      <el-option label="None" value="none" />
      <el-option :label="t('metadata.validation.date.specialValue')" value="special" />
      <el-option :label="t('metadata.validation.date.specificDate')" value="date" />
    </el-select>

    <el-select
      v-if="defaultValueType === 'special'"
      v-model="form.defaultValue"
      :placeholder="t('metadata.validation.date.specialValue')"
      class="special-value-select"
    >
      <el-option label="Today" value="today" />
      <el-option label="Tomorrow" value="tomorrow" />
      <el-option label="Yesterday" value="yesterday" />
      <el-option label="Now" value="now" />
    </el-select>

    <ElDatePicker
      v-if="defaultValueType === 'date'"
      v-model="form.defaultValue"
      :type="form.dateOrDateTime === 'date' ? 'date' : 'datetime'"
      :format="form.format"
      :placeholder="t('metadata.validation.date.specificDate')"
      class="date-picker"
    />
  </el-form-item>

  <el-form-item :label="t('meta.multiple')" prop="isMultiple">
    <el-switch v-model="form.isMultiple" />
  </el-form-item>
</template>

<style scoped lang="scss">
.date-default-value-select {
  margin-bottom: var(--app-space-xs);
}
</style>
