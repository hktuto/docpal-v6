<template>
  <div>
    <ElForm :model="formData" label-position="top">
      <div v-for="column in columns" :key="column.field">
        <component v-if="mode === 'edit' || !systemFieldsTypes.includes(column.type)" :is="getComponent(column.type)" :form-data="formData" :column="column" />
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
const props = defineProps<{
  formData: any
  mode: 'default' | 'edit'
}>()
const { columns } = useMDTableInject()
const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
const componentMap = {
  'Text': resolveComponent('LazyMdFormFieldText'),
  'MultiText': resolveComponent('LazyMdFormFieldMultiText'),
  'Number': resolveComponent('LazyMdFormFieldNumber'),
  'DateTime': resolveComponent('LazyMdFormFieldDateTime'),
  'SingleSelect': resolveComponent('LazyMdFormFieldSingleSelect'),
  'MultiSelect': resolveComponent('LazyMdFormFieldMultiSelect'),
  'Rating': resolveComponent('LazyMdFormFieldRating'),
  'URL': resolveComponent('LazyMdFormFieldURL'),
  'Email': resolveComponent('LazyMdFormFieldEmail'),
  'Phone': resolveComponent('LazyMdFormFieldPhone'),
  'Checkbox': resolveComponent('LazyMdFormFieldCheckbox'),
  'Member': resolveComponent('LazyMdFormFieldMember'),
  'MagicLink': resolveComponent('LazyMdFormFieldMagicLink'),
  'VirtualColumn': resolveComponent('LazyMdFormFieldVirtualColumn'),
  // 'Formula': resolveComponent('LazyMdFormFieldFormula'),
  // 'CreatedTime': resolveComponent('LazyMdFormFieldCreatedTime'),
  // 'LastModifiedTime': resolveComponent('LazyMdFormFieldLastModifiedTime'),
  // 'CreatedBy': resolveComponent('LazyMdFormFieldCreatedBy'),
  // 'LastModifiedBy': resolveComponent('LazyMdFormFieldLastModifiedBy'),
  'Attachment': resolveComponent('LazyMdFormFieldAttachment'),
  'TwoWayLink': resolveComponent('LazyMdFormFieldTwoWayLink'),
}
const getComponent = (type: string) => {
  const s_type = ColumnFieldType[type]
  return componentMap[s_type] || resolveComponent('LazyMdFormFieldDisabled')
}
</script>

<style scoped lang="scss">

</style>
