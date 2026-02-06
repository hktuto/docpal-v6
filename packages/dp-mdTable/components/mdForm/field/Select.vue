<template>
  <MdFormItem v-if="formData && column.field" v-bind="props">
    <el-select v-model="formData[column.field]" :multiple="column.type === ColumnFieldType.MultiSelect" :placeholder="column.placeholder" clearable>
      <el-option v-for="option in column.properties.options" :key="option.id" :label="option.label" :value="option.id" >
      <div class="flex items-center">
        <el-tag :color="option.color" style="margin-right: 8px" size="small" />
        <span :style="{ color: option.color }">{{ option.label }}</span>
      </div>
      </el-option>
      <template v-if="column.type === ColumnFieldType.MultiSelect" #tag>
        <el-tag v-for="optId in formData[column.field]" :key="optId" effect="dark" :color="getOptionColor(optId)" closable @close="handleClose(optId)">{{ getOptionLabel(optId) }}</el-tag>
      </template>
      <template v-else #label>
          <el-tag :key="formData[column.field]" :color="getOptionColor(formData[column.field])" effect="dark" closable @close="handleClose(formData[column.field])">{{ getOptionLabel(formData[column.field]) }}</el-tag>
      </template>
    </el-select>
  </MdFormItem>
</template>
<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
}>()
function getOptionColor(id: string) {
  return props.column.properties.options.find((option: any) => option.id === id)?.color
}
function getOptionLabel(id: string) {
  return props.column.properties.options.find((option: any) => option.id === id)?.label
}
function handleClose(id: string) {
  props.formData[props.column.field] = props.formData[props.column.field].filter((item: any) => item !== id)
}
</script>
