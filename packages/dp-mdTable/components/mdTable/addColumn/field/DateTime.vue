<template>
  <div>
    <el-form-item :label="t('mdTable.addColumnField.dateFormat')">
      <el-select v-model="formData.dateFormat" filterable :placeholder="t('mdTable.addColumnField.selectDateFormat')" @visible-change="onSelectVisibleChange">
        <el-option v-for="option in dateFormatOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </el-form-item>
    <div class="switch-container">
      <div>{{ t('mdTable.addColumnField.showTimeAndRegion') }}</div>
      <el-switch v-model="formData.includeTime" @change="onIncludeTimeChange" />
    </div>
    <template v-if="formData.includeTime">
      <el-select v-model="formData.dateTimeFormat" style="margin-bottom: var(--app-space-s)" :placeholder="t('mdTable.addColumnField.selectTime')" @visible-change="onSelectVisibleChange">
        <el-option :label="t('mdTable.addColumnField.hour12')" value="hh:mm A" />
        <el-option :label="t('mdTable.addColumnField.hour24')" value="HH:mm" />
      </el-select>
      <el-select v-model="formData.timezone" :placeholder="t('mdTable.addColumnField.selectTimezone')" @visible-change="onSelectVisibleChange">
        <el-option v-for="option in timezoneOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>
    <el-checkbox v-model="formData.includeTimeZone">{{ t('mdTable.addColumnField.showTimezoneMark') }}</el-checkbox>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()
const dateFormatOptions = [
  { label: formatDate(new Date(), 'YYYY-MM-DD'), value: 'YYYY-MM-DD' },
  { label: formatDate(new Date(), 'YYYY/MM/DD'), value: 'YYYY/MM/DD' },
  { label: formatDate(new Date(), 'YYYY-MMM-DD'), value: 'YYYY-MMM-DD' }
]
// 从父组件获取select visible change处理函数
const handleSelectVisibleChange = inject<(visible: boolean) => void>('handleSelectVisibleChange')

// 包装函数，确保安全调用
const onSelectVisibleChange = (visible: boolean) => {
  if (handleSelectVisibleChange) {
    handleSelectVisibleChange(visible)
  }
}
function onIncludeTimeChange(value: boolean) {
  if (value) {
    props.formData.dateTimeFormat = 'HH:mm'
    props.formData.timezone = getCurrentTimezoneAndOffset()
    const index = timezoneOptions.findIndex((option) => option.value === props.formData.timezone)
    if (index !== -1) {
      timezoneOptions.unshift(timezoneOptions.splice(index, 1)[0])
    }
  } else {
    props.formData.dateTimeFormat = undefined
    props.formData.timezone = undefined
  }
}
// 获取当前用户时区与偏移量
const getCurrentTimezoneAndOffset = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  // const date = new Date()
  // const timezoneOffset = date.getTimezoneOffset() // 以分钟为单位
  // const offsetInHours = timezoneOffset / 60
  return timezone
}
</script>

<style lang="scss" scoped></style>
