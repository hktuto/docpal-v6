<template>
  <ElForm ref="formRef" :model="formData" label-position="top">
    <component
      :is="getComponent(column.business_type)"
      v-for="column in normalizedColumns"
      :key="column.id || column.field_name"
      :form-data="formData"
      :column="column"
      :disabled="mode === 'edit' && systemFieldsTypes.includes(column.business_type)"
      field-name="field_name"
    />
  </ElForm>
  <MdFormPopover v-if="originalShow" ref="MdFormPopoverRef" :columns="columns" :systemFieldsTypes="systemFieldsTypes" showSourceButtons @submit="handleOriginalSubmit" />
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import { ColumnFieldType, reverseColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  mode: 'default' | 'edit'
  columns: any[]
  systemFieldsTypes: any[]
}>()
const originalShow = ref(false)
const componentMap = {
  Text: resolveComponent('LazyMdFormFieldText'),
  MultiText: resolveComponent('LazyMdFormFieldMultiText'),
  Number: resolveComponent('LazyMdFormFieldNumber'),
  DateTime: resolveComponent('LazyMdFormFieldDateTime'),
  SingleSelect: resolveComponent('LazyMdFormFieldSelect'),
  MultiSelect: resolveComponent('LazyMdFormFieldSelect'),
  Rating: resolveComponent('LazyMdFormFieldRating'),
  URL: resolveComponent('LazyMdFormFieldURL'),
  Email: resolveComponent('LazyMdFormFieldText'),
  Phone: resolveComponent('LazyMdFormFieldText'),
  Checkbox: resolveComponent('LazyMdFormFieldCheckbox'),
  Member: resolveComponent('LazyMdFormFieldMember'),
  // VirtualColumn: resolveComponent('LazyMdFormFieldVirtualColumn'),
  Relation: resolveComponent('LazyMdFormFieldRelation'),
  // 'Formula': resolveComponent('LazyMdFormFieldFormula'),
  CreatedTime: resolveComponent('LazyMdFormFieldDateTime'),
  LastModifiedTime: resolveComponent('LazyMdFormFieldDateTime'),
  // 'CreatedBy': resolveComponent('LazyMdFormFieldCreatedBy'),
  // 'LastModifiedBy': resolveComponent('LazyMdFormFieldLastModifiedBy'),
  Document: resolveComponent('LazyMdFormFieldDocument'),
  User: resolveComponent('LazyMdFormFieldUser'),
  Rating: resolveComponent('LazyMdFormFieldRating')
}
const getComponent = (type: string) => {
  const s_type = reverseColumnFieldType[type]
  return componentMap[s_type] || resolveComponent('LazyMdFormFieldDisabled')
}
const normalizedColumns = computed(() => {
  console.log('props.columns', props.columns)
  if (!props.columns) return []
  console.log('props.columns', props.columns)
  return props.columns
    .map((column: any) => {
      return {
        ...column,
        field: column.field ?? column.field_name,
        title: column.title ?? column.field_name_alias ?? column.field_name
      }
    })
})

const formRef = ref()
const getFormData = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) {
      console.error('formData is not valid')
      return false
    }
    console.log('props.formData', props.columns)
    console.log('props.systemFieldsTypes', props.systemFieldsTypes)
    const newFormData = props.columns
      .filter((column: any) => !props.systemFieldsTypes.includes(column.business_type))
      .reduce((acc: any, column: any) => {
        acc[column.field_name] = props.formData[column.field_name]
        return acc
      }, {})
    return newFormData
  } catch (error) {
    console.error('formData is not valid', error)
    return false
  }
}
const MdFormPopoverRef = ref()
function handleOriginalClick(id: any) {
  // originalShow.value = true
  // setTimeout(() => {
  //   MdFormPopoverRef.value.open(id)
  // }, 1000)
}
function handleOriginalSubmit(data: any) {
  console.log('handleOriginalSubmit', data)
}
defineExpose({
  getFormData
})
</script>

<style scoped lang="scss"></style>
