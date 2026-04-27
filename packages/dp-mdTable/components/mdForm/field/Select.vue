<template>
  <MdFormItem v-if="formData && column[fieldName]" v-bind="props">
    <el-select v-model="formData[column[fieldName]]" :multiple="column.type === ColumnFieldType.MultiSelect" :placeholder="column.placeholder" filterable clearable>
      <el-option v-for="option in column.display_structure.options" :key="option.id" :label="option.label" :value="option.id">
        <div class="flex items-center">
          <el-tag :color="option.color" style="margin-right: 8px" size="small" />
          <span :style="{ color: option.color }">{{ option.label }}</span>
        </div>
      </el-option>
      <template v-if="column.type === ColumnFieldType.MultiSelect" #tag>
        <el-tag v-for="optId in formData[column[fieldName]]" :key="optId" effect="dark" :color="getOptionColor(optId)" closable @close="handleClose(optId)">
          {{ getOptionLabel(optId) }}
        </el-tag>
      </template>
      <template v-else #label="{ label, value }">
        <el-tag :color="getOptionColor(formData[column[fieldName]])" effect="dark">{{ getOptionLabel(formData[column[fieldName]]) }}</el-tag>
      </template>
    </el-select>
  </MdFormItem>
</template>
<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
  fieldName: string
}>()
function getOptionColor(id: string) {
  return props.column.display_structure.options.find((option: any) => option.id === id)?.color
}
function getOptionLabel(id: string) {
  return props.column.display_structure.options.find((option: any) => option.id === id)?.label
}
function handleClose(id: string) {
  if (props.column.type === ColumnFieldType.MultiSelect) {
    props.formData[props.column[fieldName]] = props.formData[props.column[fieldName]].filter((item: any) => item !== id)
  } else {
    props.formData[props.column[fieldName]] = ''
  }
}
</script>
