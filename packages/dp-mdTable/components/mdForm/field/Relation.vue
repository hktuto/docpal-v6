<template>
  <MdFormItem v-bind="props">
    <ElSelect v-model="formData.relationTableId" placeholder="Select target table" style="width: 100%">
      <ElOption v-for="table in availableTables" :key="table.id" :label="table.name" :value="table.id" />
    </ElSelect>
  </MdFormItem>
</template>
<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
}>()
</script>
<style lang="scss" scoped>
</style>
