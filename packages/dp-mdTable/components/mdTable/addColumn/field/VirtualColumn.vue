<template>
  <el-form-item label="Relation Table" prop="relation_table_id">
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
  <el-form-item label="Display Field" prop="display_field_name">
    <el-select v-model="formData.display_field_name" clearable placeholder="Select Display Field" @change="handleDisplayFieldChange">
      <el-option v-for="field in tableFields" :key="field.id" :label="field.field_name_alias" :value="field.field_name" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
}>()
const cascaderProps = {
  label: 'name',
  value: 'id'
}
const tableFields = ref([])
const { menus, menuIdPaths, isAgg, getTableFields, relationTables, updateRelationField } = useVirtualColumn(props.formData.relation_table_id, props.formData.business_type)
const placeholder = computed(() => isAgg.value ? 'Select a number field' : 'Select Display Field')
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
    props.formData.relation_field_name = ''
  }
}
function handleDisplayFieldChange(value: string) {
  const selectedField = tableFields.value.find((field: any) => field.field_name === value)
  props.formData.display_field_id = selectedField.id
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
})
</script>
<style scoped lang="scss">
:deep(.el-cascader) {
  width: 100%;
}
</style>
