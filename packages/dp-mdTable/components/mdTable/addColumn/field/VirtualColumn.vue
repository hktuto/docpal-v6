<template>
  <div>
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
      <el-select
        v-model="formData.display_field_name"
        clearable
        :placeholder="t('mdTable.addColumnField.selectDisplayField')"
        @change="handleDisplayFieldChange"
      >
        <el-option v-for="field in tableFields" :key="field.id" :label="field.field_name_alias" :value="field.field_name" />
      </el-select>
    </el-form-item>
    <component :is="AsyncComponent" v-if="AsyncComponent && shouldShowFieldSetting" :form-data="formData" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, shallowRef } from 'vue'
import type { Component } from 'vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const { t } = useI18n()
const props = defineProps<{
  formData: any
}>()
interface TableField {
  id: string
  field_name: string
  field_name_alias: string
  business_type: ColumnFieldType | string | number
  display_structure?: Record<string, any>
}

const AsyncComponent = shallowRef<null | Component>(null)
const cascaderProps = {
  label: 'name',
  value: 'id'
}
const tableFields = ref<TableField[]>([])
const { menus, menuIdPaths, isAgg, getTableFields, relationTables, updateRelationField } = useVirtualColumn(
  props.formData.relation_table_id,
  props.formData.business_type
)
const showSettingList = [ColumnFieldType.DateTime, ColumnFieldType.Number]
const fieldSettingComponentMap: Partial<Record<ColumnFieldType, Component>> = {
  [ColumnFieldType.Number]: defineAsyncComponent(() => import('./Number.vue')),
  [ColumnFieldType.DateTime]: defineAsyncComponent(() => import('./DateTime.vue'))
}
const virtualColumnBaseKeys = new Set([
  'field_name',
  'business_type',
  'relation_table_id',
  'relation_field_name',
  'display_field_id',
  'display_field_name',
  'display_field_type',
  'aggregation_field_name',
  'aggregation_method'
])
const displayFieldType = computed(() => normalizeFieldType(props.formData.display_field_type))
const shouldShowFieldSetting = computed(() => showSettingList.includes(displayFieldType.value))

function normalizeFieldType(fieldType: ColumnFieldType | string | number) {
  return String(fieldType) as ColumnFieldType
}

function loadFieldComponent(fieldType: ColumnFieldType | string | number) {
  AsyncComponent.value = fieldSettingComponentMap[normalizeFieldType(fieldType)] || null
}

function clearExtraFormDataProps() {
  Object.keys(props.formData).forEach((key) => {
    if (!virtualColumnBaseKeys.has(key)) {
      delete props.formData[key]
    }
  })
}

function getAppendDisplayStructure(selectedField: TableField) {
  return Object.fromEntries(
    Object.entries(selectedField.display_structure || {}).filter(([key]) => !virtualColumnBaseKeys.has(key))
  )
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
  const selectedField = tableFields.value.find((field) => field.field_name === value)
  clearExtraFormDataProps()
  if (!selectedField) {
    AsyncComponent.value = null
    props.formData.display_field_id = ''
    props.formData.display_field_name = ''
    props.formData.display_field_type = ''
    return
  }
  props.formData.display_field_id = selectedField.id
  props.formData.display_field_name = selectedField.field_name
  props.formData.display_field_type = selectedField.business_type
  Object.assign(props.formData, getAppendDisplayStructure(selectedField))
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
