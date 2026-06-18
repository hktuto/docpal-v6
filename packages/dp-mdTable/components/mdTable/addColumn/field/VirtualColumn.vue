<template>
  <el-form-item :label="t('mdTable.addColumnField.relationTable')" prop="relation_table_id">
    <el-cascader
      v-model="menuIdPaths"
      show-checked-strategy="parent"
      placement="left-start"
      :options="menus"
      :props="cascaderProps"
      clearable
      @change="handleRTChange"
    >
      <template #default="{ node, data }">
        <div class="cascader-item">
          <Icon :name="data.item_type === 'folder' ? 'material-symbols:folder-outline' : 'material-symbols:table-outline'" />
          {{ data.name }}
        </div>
      </template>
    </el-cascader>
  </el-form-item>
  <el-form-item :label="t('mdTable.addColumnField.displayField')" prop="display_field_name">
    <el-select v-model="formData.display_field_name" clearable :placeholder="t('mdTable.addColumnField.selectDisplayField')" @change="handleDisplayFieldChange">
      <el-option v-for="field in tableFields" :key="field.id" :label="field.field_name_alias" :value="field.field_name" />
    </el-select>
  </el-form-item>
  <component :is="AsyncComponent" v-if="AsyncComponent && showSettingList.includes(formData.display_field_type)" :form-data="formData" />
</template>

<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()
const AsyncComponent = ref<null | any>(null)
const cascaderProps = {
  label: 'name',
  value: 'id'
}
const tableFields = ref([])
const { menus, menuIdPaths, isAgg, getTableFields, relationTables, updateRelationField } = useVirtualColumn(
  props.formData.relation_table_id,
  props.formData.business_type
)
const showSettingList = [ColumnFieldType.DateTime,ColumnFieldType.Number]
const componentMap: Record<number, string> = {
  [ColumnFieldType.Number]: 'Number',
  [ColumnFieldType.DateTime]: 'DateTime',
  [ColumnFieldType.SingleSelect]: 'Select',
  [ColumnFieldType.MultiSelect]: 'Select',
  [ColumnFieldType.Checkbox]: 'Checkbox',
  [ColumnFieldType.Rating]: 'Rating'
}

function loadFieldComponent(fieldType: ColumnFieldType) {
  const componentName = componentMap[fieldType]
  AsyncComponent.value = componentName ? defineAsyncComponent(() => import(`./${componentName}.vue`)) : null
}

function buildInitialFieldSettings(selectedField: any) {
  const sourceProps = selectedField?.display_structure || {}
  if (componentMap[selectedField.business_type]) {
    return sourceProps
  }
  return {}
}
// Relation Table Change
async function handleRTChange(value: string[]) {
  try {
    const id = value[value.length - 1]
    props.formData.relation_table_id = id
    tableFields.value = await getTableFields(id)
  } catch (error) {
    tableFields.value = []
    menuIdPaths.value = []
    props.formData.relation_table_id = ''
    props.formData.relation_field_name = ''
    props.formData.display_field_name = ''
  }
}
function handleDisplayFieldChange(value: string) {
  const selectedField = tableFields.value.find((field: any) => field.field_name === value)
  if (!selectedField) {
    AsyncComponent.value = null
    return
  }
  console.log('selectedField', selectedField)
  props.formData.display_field_id = selectedField.id
  props.formData.display_field_name = selectedField.field_name
  props.formData.display_field_type = selectedField.business_type
  Object.assign(props.formData, buildInitialFieldSettings(selectedField))
  loadFieldComponent(selectedField.business_type)
  if (isAgg.value) {
    props.formData.aggregation_field_name = selectedField.field_name
    props.formData.aggregation_method = 'sum'
  }
  updateRelationField(props.formData)
}
onMounted(() => {
  if (props.formData.relation_table_id) {
    handleRTChange([props.formData.relation_table_id])
  }
  if (props.formData.display_field_type) {
    loadFieldComponent(props.formData.display_field_type)
  }
})
</script>
<style scoped lang="scss">
:deep(.el-cascader) {
  width: 100%;
}
</style>
