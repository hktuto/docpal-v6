<template>
  <div>
    <el-form-item label="日期格式">
      <el-select v-model="formData.dateFormat" allow-create filterable placeholder="请选择日期格式" @visible-change="onSelectVisibleChange">
        <el-option v-for="option in dateFormatOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </el-form-item>
    <div class="switch-container">
      <div>显示时间与地区</div>
      <el-switch v-model="formData.includeTime" />
    </div>
    <template v-if="formData.includeTime">
      <el-select v-model="formData.dateTimeFormat" style="margin-bottom: var(--app-space-s)" placeholder="请选择时间" @visible-change="onSelectVisibleChange">
        <el-option label="12小时" value="hh:mm A" />
        <el-option label="24小时" value="HH:mm" />
      </el-select>
      <el-select v-model="formData.timezone" placeholder="请选择时区" @visible-change="onSelectVisibleChange">
        <el-option v-for="option in timezoneOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>
    </template>
    <el-checkbox v-model="formData.includeTimeZone">显示时区标识</el-checkbox>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
const props = defineProps<{
  formData: any
}>()
const dateFormatOptions = [
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
  { label: 'YYYY-MMM-DD', value: 'YYYY-MMM-DD' }
]

// 从父组件获取select visible change处理函数
const handleSelectVisibleChange = inject<(visible: boolean) => void>('handleSelectVisibleChange')

// 包装函数，确保安全调用
const onSelectVisibleChange = (visible: boolean) => {
  if (handleSelectVisibleChange) {
    handleSelectVisibleChange(visible)
  }
}
// 获取当前用户时区与偏移量
const getCurrentTimezoneAndOffset = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const date = new Date()
  const timezoneOffset = date.getTimezoneOffset() // 以分钟为单位
  const offsetInHours = timezoneOffset / 60
  return { label: timezone, value: timezone, offset: offsetInHours }
}
const timezoneOptions = [
  getCurrentTimezoneAndOffset(),
  { label: 'UTC', value: 'UTC', offset: 0 },
  { label: 'Asia/Shanghai', value: 'Asia/Shanghai', offset: -8 },
  { label: 'America/New_York', value: 'America/New_York', offset: 5 },
  { label: 'Europe/London', value: 'Europe/London', offset: -1 }
]
</script>

<style lang="scss" scoped>

</style>
