<script setup lang="ts">
const form = defineModel<{}>('form')
const { t } = useI18n()
const pattern = ref('YYYY-MM-DD HH:mm:ss')

function handelUpdatePattern() {
  const validation = {
    pattern: pattern.value
  }
  form.value.items.properties.start.validation = validation
  form.value.items.properties.end.validation = validation
}

onMounted(() => {
  pattern.value = form.value.items?.properties?.start?.validation?.pattern || 'YYYY-MM-DD'
})
</script>

<template>
  <el-form-item :label="t('metadata.validation.date.format')">
    <el-select
      v-model="pattern"
      :placeholder="t('metadata.validation.date.format')"
      filterable
      default-first-option
      class="date-format-select"
      @change="handelUpdatePattern"
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

<style scoped lang="scss"></style>
