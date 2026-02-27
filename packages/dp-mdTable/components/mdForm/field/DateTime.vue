<template>
  <MdFormItem v-bind="_props" :rules="rules">
    <el-date-picker
      v-if="formData && column && column.field"
      v-model="formData[column.field]"
      :type="properties.includeTime ? 'datetime' : 'date'"
      :format="displayFormat"
      :disabled="disabledFields.includes(column.type)"
      value-format="x"
      :placeholder="column.placeholder ?? (properties.includeTime ? '选择日期和时间' : '选择日期')"
      clearable
      style="width: 100%"
    />
  </MdFormItem>
</template>

<script setup lang="ts">
import type { DateTimeConfig, TimeZone } from '@packages/dp-mdTable/types/column-types'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
}>()
const disabledFields = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime]
const _props = computed(() => {
  const columnItem = JSON.parse(JSON.stringify(props.column))
  if (!columnItem?.properties) return columnItem

  if (columnItem.properties.includeTime && columnItem.properties.includeTimeZone) {
    columnItem.title = columnItem.title + ' (' + columnItem.properties.timezone + ')'
  }

  return {
    ...props,
    column: columnItem
  }
})

/**
 * 日期时间列配置（column.properties）
 * 支持 DateTimeConfig 或 addColumn 结构：日期格式、是否含时间、时间格式、地区（时区）
 */
const properties = computed(() => {
  const p = props.column?.properties ?? {}
  // timeFormat: 0=仅日期, 1=12小时, 2=24小时（与 DateTimeConfig 一致时）
  const timeFormat = typeof p.timeFormat === 'number' ? p.timeFormat : p.includeTime ? 2 : 0
  const includeTime = p.includeTime === true || timeFormat > 0
  const dateTimeFormat = p.dateTimeFormat ?? (timeFormat === 1 ? 'hh:mm A' : 'HH:mm')
  return {
    dateFormat: p.dateFormat ?? 'YYYY-MM-DD',
    includeTime,
    dateTimeFormat,
    timeZone: (p.timeZone ?? p.timezone ?? 'local') as TimeZone,
    autoFill: p.autoFill ?? false
  }
})

/** 用于 el-date-picker 的 format 显示 */
const displayFormat = computed(() => {
  const { dateFormat, includeTime, dateTimeFormat } = properties.value
  return includeTime ? `${dateFormat} ${dateTimeFormat}` : dateFormat
})

const rules = computed(() => {
  if (!props.column) return []
  const list: any[] = []
  if (props.column.required) {
    list.push({ required: true })
  }
  return list
})
</script>

<style lang="scss" scoped>
.el-date-editor {
  width: 100%;
}
</style>
