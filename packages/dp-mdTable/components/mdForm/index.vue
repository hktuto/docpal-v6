<template>
  <ElForm ref="formRef" :model="formData" label-positizon="top">
    <div v-for="column in columns" :key="column.field">
      <component v-if="mode === 'edit' || !systemFieldsTypes.includes(column.type)" :is="getComponent(column.type)" :form-data="formData" :column="column" />
    </div>
  </ElForm>
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
  'SingleSelect': resolveComponent('LazyMdFormFieldSelect'),
  'MultiSelect': resolveComponent('LazyMdFormFieldSelect'),
  'Rating': resolveComponent('LazyMdFormFieldRating'),
  'URL': resolveComponent('LazyMdFormFieldURL'),
  'Email': resolveComponent('LazyMdFormFieldText'),
  'Phone': resolveComponent('LazyMdFormFieldText'),
  'Checkbox': resolveComponent('LazyMdFormFieldCheckbox'),
  'Member': resolveComponent('LazyMdFormFieldMember'),
  'MagicLink': resolveComponent('LazyMdFormFieldMagicLink'),
  'VirtualColumn': resolveComponent('LazyMdFormFieldVirtualColumn'),
  'Relation': resolveComponent('LazyMdFormFieldRelation'),
  // 'Formula': resolveComponent('LazyMdFormFieldFormula'),
  // 'CreatedTime': resolveComponent('LazyMdFormFieldCreatedTime'),
  // 'LastModifiedTime': resolveComponent('LazyMdFormFieldLastModifiedTime'),
  // 'CreatedBy': resolveComponent('LazyMdFormFieldCreatedBy'),
  // 'LastModifiedBy': resolveComponent('LazyMdFormFieldLastModifiedBy'),
  'Attachment': resolveComponent('LazyMdFormFieldAttachment'),
  'Member': resolveComponent('LazyMdFormFieldMember'),
}
const getComponent = (type: string) => {
  const s_type = ColumnFieldType[type]
  console.log(type, s_type)
  return componentMap[s_type] || resolveComponent('LazyMdFormFieldDisabled')
}

const formRef = ref()
const getFormData = async () => {
  try {
    const valid = await formRef.value.validate()
    if(!valid) {
      console.error('formData is not valid')
      return false
    }
    return props.formData
  } catch (error) {
    console.error('formData is not valid', error)
    return false
  }
}
defineExpose({
  getFormData
})
</script>

<style scoped lang="scss">

</style>
