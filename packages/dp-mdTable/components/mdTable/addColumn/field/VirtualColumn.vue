<script setup lang="ts">
import { defineAsyncComponent, inject, onMounted, provide, ref } from 'vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useVirtualColumn } from '../../../../composables/Relation/useVirtualColumn'

const props = defineProps<{
  formData: any
}>()

const AsyncComponent = ref<null | ReturnType<typeof defineAsyncComponent>>(null)
const cascaderProps = {
  label: 'name',
  value: 'id'
}
const tableFields = ref<any[]>([])
const { menus, menuIdPaths, isAgg, getTableFields, updateRelationField } = useVirtualColumn(
  props.formData.relation_table_id,
  props.formData.business_type
)

const showSettingList = [ColumnFieldType.DateTime, ColumnFieldType.Number]
const fieldComponentLoaders: Partial<Record<ColumnFieldType, () => Promise<{ default: unknown }>>> = {
  [ColumnFieldType.Number]: () => import('./Number.vue'),
  [ColumnFieldType.DateTime]: () => import('./DateTime.vue'),
  [ColumnFieldType.SingleSelect]: () => import('./Select.vue'),
  [ColumnFieldType.MultiSelect]: () => import('./Select.vue'),
  [ColumnFieldType.Checkbox]: () => import('./Checkbox.vue'),
  [ColumnFieldType.Rating]: () => import('./Rating.vue')
}

const handleSelectVisibleChange = inject<(visible: boolean) => void>('handleSelectVisibleChange')
if (handleSelectVisibleChange) {
  provide('handleSelectVisibleChange', handleSelectVisibleChange)
}

function loadFieldComponent(fieldType: ColumnFieldType) {
  const loader = fieldComponentLoaders[fieldType]
  AsyncComponent.value = loader ? defineAsyncComponent(loader) : null
}

function buildInitialFieldSettings(selectedField: any) {
  const sourceProps = selectedField?.display_structure || {}
  if (fieldComponentLoaders[selectedField.business_type as ColumnFieldType]) {
    return sourceProps
  }
  return {}
}

async function handleRTChange(value: string[]) {
  try {
    const id = value[value.length - 1]
    props.formData.relation_table_id = id
    tableFields.value = await getTableFields(id)
  } catch {
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

<template>
  <el-form-item :label="$t('mdTable.addColumnField.relationTable')" prop="relation_table_id">
    <el-cascader
      v-model="menuIdPaths"
      show-checked-strategy="parent"
      placement="left-start"
      :options="menus"
      :props="cascaderProps"
      clearable
      @change="handleRTChange"
    >
      <template #default="{ data }">
        <div class="cascader-item">
          <Icon :name="data.item_type === 'folder' ? 'material-symbols:folder-outline' : 'material-symbols:table-outline'" />
          {{ data.name }}
        </div>
      </template>
    </el-cascader>
  </el-form-item>
  <el-form-item :label="$t('mdTable.addColumnField.displayField')" prop="display_field_name">
    <el-select
      v-model="formData.display_field_name"
      clearable
      :placeholder="$t('mdTable.addColumnField.selectDisplayField')"
      @change="handleDisplayFieldChange"
    >
      <el-option v-for="field in tableFields" :key="field.id" :label="field.field_name_alias" :value="field.field_name" />
    </el-select>
  </el-form-item>
  <component
    :is="AsyncComponent"
    v-if="AsyncComponent && showSettingList.includes(formData.display_field_type)"
    :form-data="formData"
  />
</template>

<style scoped lang="scss">
:deep(.el-cascader) {
  width: 100%;
}

.cascader-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
