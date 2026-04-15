<template>
  <el-form-item label="Relation Table" prop="table_id_paths">
    <el-cascader
      v-model="formData.table_id_paths"
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
    <el-select v-model="formData.display_field_name" placeholder="Select Display Field" @change="handleDisplayFieldChange">
      <el-option v-for="field in tableFields" :key="field.id" :label="field.field_name_alias" :value="field.field_name" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
const props = defineProps<{
  formData: any
}>()
const cascaderProps = {
  label: 'name',
  value: 'id'
}
const tableFields = ref([])
const { menus, getTableFields, relationTables, updateRelationField } = useVirtualColumn()

async function handleRTChange(value: string[]) {
  try {
    const id = value[value.length - 1]
    tableFields.value = await getTableFields(id)
  } catch (error) {
    tableFields.value = []
    props.formData.relation_field_name = ''
    props.formData.display_field_name = ''
    props.formData.virtual_field_name = ''
  }
}
function handleDisplayFieldChange(value: string) {
  const selectedField = tableFields.value.find((field: any) => field.field_name === value)
  props.formData.display_field_id = selectedField.id
  updateRelationField(props.formData)
}
onMounted(() => {
  if (props.formData.table_id_paths) {
    handleRTChange(props.formData.table_id_paths)
  }
})
</script>
<style scoped lang="scss">
:deep(.el-cascader) {
  width: 100%;
}

</style>
