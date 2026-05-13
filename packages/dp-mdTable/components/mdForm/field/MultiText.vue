<template>
  <MdFormItem v-bind="props" :rules="rules">
    <ElInput v-if="formData && column[fieldName]"
    v-model="formData[column[fieldName]]" type="textarea" :rows="1" autosize :placeholder="column.placeholder" clearable
        :disabled="disabled"
    />
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()

</script>

<style lang="scss" scoped></style>
