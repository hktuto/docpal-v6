<template>
  <MdFormItem v-bind="props">
    <template v-if="formData && column.field">
      <el-date-picker
        v-if="column.type === ColumnFieldType.CreatedTime"
        v-model="formData[column.field]"
        type="date"
        :format="displayFormat"
        disabled
        value-format="x"
        clearable
        style="width: 100%"
      />
      <ElInput v-else v-model="formData[column.field]" :disabled="true" :placeholder="column.placeholder" clearable />
    </template>
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
}>()
const displayFormat = computed(() => {
  const properties = props.column.properties ?? {}
  console.log(properties)
  // if(properties.includeTime) {
  //   return properties.dateTimeFormat + ' ' + properties.timezone
  // } else {
  //   return properties.dateFormat
  // }
  return 'YYYY-MM-DD'
})
</script>

<style lang="scss" scoped></style>
