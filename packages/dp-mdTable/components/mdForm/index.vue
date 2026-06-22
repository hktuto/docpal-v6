<template>
  <ElForm ref="formRef" :model="formData" label-position="top">

    <component
      :is="getComponent(column.business_type)"
      v-for="column in displayColumns"
      :key="column.id || column.field_name"
      :form-data="formData"
      :column="column"
      :disabled="mode !== 'edit' || systemFieldsTypes.includes(column.business_type)"
      field-name="field_name"
    />
    <el-button v-if="hiddenColumns.length > 0" class="hidden-columns-button" plain text :icon="CaretRight" :class="{ 'is-rotate': showHiddenColumns }" @click="showHiddenColumns = !showHiddenColumns">
      Hidden Columns({{ hiddenColumns.length }})
    </el-button>
    <template v-if="showHiddenColumns">
      <el-divider border-style="dashed" />
      <component
        :is="getComponent(column.business_type)"
        v-for="column in hiddenColumns"
        :key="column.id || column.field_name"
        :form-data="formData"
        :column="column"
        :disabled="mode !== 'edit' ||  systemFieldsTypes.includes(column.business_type)"
        field-name="field_name"
      />
    </template>
  </ElForm>
  <MdFormPopover
    v-if="originalShow"
    ref="MdFormPopoverRef"
    :columns="columns"
    :systemFieldsTypes="systemFieldsTypes"
    showSourceButtons
    @submit="handleOriginalSubmit"
  />
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import { CaretRight } from '@element-plus/icons-vue'
import { ColumnFieldType, reverseColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  mode: 'default' | 'edit'
  columns: any[]
  systemFieldsTypes: any[]
}>()
const showHiddenColumns = ref(false)
const originalShow = ref(false)
const componentMap = {
  Text: resolveComponent('LazyMdFormFieldText'),
  MultiText: resolveComponent('LazyMdFormFieldMultiText'),
  Number: resolveComponent('LazyMdFormFieldNumber'),
  DateTime: resolveComponent('LazyMdFormFieldDateTime'),
  SingleSelect: resolveComponent('LazyMdFormFieldSelect'),
  MultiSelect: resolveComponent('LazyMdFormFieldSelect'),
  Rating: resolveComponent('LazyMdFormFieldRating'),
  URL: resolveComponent('LazyMdFormFieldUrl'),
  Email: resolveComponent('LazyMdFormFieldText'),
  Phone: resolveComponent('LazyMdFormFieldText'),
  Checkbox: resolveComponent('LazyMdFormFieldCheckbox'),
  Member: resolveComponent('LazyMdFormFieldMember'),
  VirtualColumn: resolveComponent('LazyMdFormFieldVirtualColumn'),
  Relation: resolveComponent('LazyMdFormFieldRelation'),
  // 'Formula': resolveComponent('LazyMdFormFieldFormula'),
  CreatedTime: resolveComponent('LazyMdFormFieldDateTime'),
  LastModifiedTime: resolveComponent('LazyMdFormFieldDateTime'),
  CreatedBy: resolveComponent('LazyMdFormFieldText'),
  LastModifiedBy: resolveComponent('LazyMdFormFieldText'),
  Attachment: resolveComponent('LazyMdFormFieldDisabled'),
  DocPalDoc: resolveComponent('LazyMdFormFieldDocPalDoc'),
  User: resolveComponent('LazyMdFormFieldUser'),
  Rating: resolveComponent('LazyMdFormFieldRating')
}
const getComponent = (type: string) => {
  const s_type = reverseColumnFieldType[type]
  return componentMap[s_type] || resolveComponent('LazyMdFormFieldDisabled')
}
const hiddenColumns = ref([])
const displayColumns = ref([])

const unEditableFields = [ColumnFieldType.VirtualColumn, ColumnFieldType.Formula, ColumnFieldType.AggVirtualColumn]
const formRef = ref()
const hasOwn = (target: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(target, key)
const getColumnFieldName = (column: any) => column.field_name ?? column.field
const getColumnDefaultValue = (column: any) => {
  const displayStructure = column.display_structure ?? column.display_struture
  if (!displayStructure || !hasOwn(displayStructure, 'defaultValue')) return undefined
  const defaultValue = displayStructure.defaultValue
  if (Array.isArray(defaultValue)) return [...defaultValue]
  if (defaultValue && typeof defaultValue === 'object') return { ...defaultValue }
  return defaultValue
}
const applyDefaultValues = (columns: any[]) => {
  if (!props.formData) return
  columns.forEach((column: any) => {
    const fieldName = getColumnFieldName(column)
    if (!fieldName || hasOwn(props.formData, fieldName)) return

    const defaultValue = getColumnDefaultValue(column)
    if (defaultValue !== undefined) {
      props.formData[fieldName] = defaultValue
    }
  })
}
const getFormData = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) {
      console.error('formData is not valid')
      return false
    }
    const newFormData = props.columns
      .filter((column: any) => !props.systemFieldsTypes.includes(column.business_type) && !unEditableFields.includes(column.business_type))
      .reduce((acc: any, column: any) => {
        acc[column.field_name] = props.formData[column.field_name] ?? null
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
function handleOriginalSubmit() {
}
watch(
  () => props.columns,
  () => {
    if (!props.columns) return []
    // 在这里那relation的配置
    const normalizedColumns = props.columns.map((column: any) => {
      return {
        ...column,
        field: column.field ?? column.field_name,
        title: column.title ?? column.field_name_alias ?? column.field_name
      }
    })
    hiddenColumns.value = normalizedColumns.filter((column: any) => column.hidden)
    displayColumns.value = normalizedColumns.filter((column: any) => !column.hidden)
    applyDefaultValues(displayColumns.value)
  },
  {
    immediate: true
  }
)
watch(
  () => props.formData,
  () => {
    applyDefaultValues(displayColumns.value)
  },
  {
    immediate: true
  }
)
defineExpose({
  getFormData
})
</script>

<style scoped lang="scss">
.hidden-columns-button {
  padding: 0 var(--app-space-xs);
}
.is-rotate :deep(.el-icon) {
  transform: rotate(90deg);
  transition: transform 0.3s ease-in-out;
}
</style>
