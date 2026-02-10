<template>
  <MdFormItem v-if="formData && column?.field" v-bind="props"
    >
    <MdFormFieldRelationPicker
      v-if="relationTableId"
      :model-value="currentValue"
      :relation-table-id="relationTableId"
      :table-label="tableLabel"
      @update:model-value="handleUpdate"
    />
    <span v-else class="relation-no-config">请先配置关联表</span>
  </MdFormItem>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
const availableRecords = ref<any[]>([])
const { queryRelatedTable, getFieldsForTable } = useColumnsContext()
const relationTableId = computed(() => props.column?.properties?.relationTableId ?? '')
const tableLabel = computed(() => props.column?.properties?.relationTableName ?? props.column?.title ?? '关联表')
const currentValue = computed(() => {
  const v = props.formData?.[props.column?.field]
  return Array.isArray(v) ? v : v != null ? [v] : []
})

function handleUpdate(value: string[]) {
  if (props.formData && props.column?.field != null) {
    props.formData[props.column.field] = value
  }
}

</script>

<style lang="scss" scoped>
.relation-no-config {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
:deep(.el-form-item__content) {
  line-height: unset;
  display: flex;
  align-items: center;
}
</style>
