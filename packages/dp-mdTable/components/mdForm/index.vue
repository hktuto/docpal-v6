<template>
  <ElForm ref="formRef" :model="formData" label-position="top">
    <div v-for="column in columns" :key="column.field">
      <component v-if="mode === 'edit' || !systemFieldsTypes.includes(column.type)" :is="getComponent(column.type)" :form-data="formData" :column="column" 
        @original-click="handleOriginalClick"
      />
    </div>
    <MdFormPopover v-if="originalShow" ref="MdFormPopoverRef" showSourceButtons @submit="handleAddRowSubmit" />
  </ElForm>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  mode: 'default' | 'edit'
}>()
const { columns } = useMDTableInject()
const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
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
  const s_type = ColumnFieldType[type]
  return componentMap[s_type] || resolveComponent('LazyMdFormFieldDisabled')
}

const formRef = ref()
const getFormData = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) {
      console.error('formData is not valid')
      return false
    }
    return props.formData
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
defineExpose({
  getFormData
})
</script>

<style scoped lang="scss"></style>
