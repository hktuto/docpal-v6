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
  <el-form-item label="Allow Multiple" prop="multiple">
    <el-switch v-model="formData.multiple" />
  </el-form-item>
  <!-- Existing relation warning -->
  <!-- <div v-if="existingRelation && !isEditingExisting" class="existing-relation-notice">
      <Icon name="lucide:info" size="16" />
      <span
        >A relation to this table already exists: <strong>{{ existingRelation.fieldNameAlias }}</strong
        >. Adding display fields will update the existing relation.</span
      >
    </div> -->
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
const { menus,menuIdPaths, getTop5Fields } = useRelation(props.formData.relation_table_id)

async function handleRTChange(value: string[]) {
  props.formData.relation_table_id = value[value.length - 1]
  const top5Fields = await getTop5Fields(props.formData.relation_table_id)
  props.formData.display_field_ids = top5Fields.map((field: any) => field.id)
  props.formData.display_field_names = top5Fields.map((field: any) => field.field_name)
}
</script>

<style scoped lang="scss">
:deep(.el-cascader) {
  width: 100%;
}
.cascader-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
.relation-config {
}
</style>
