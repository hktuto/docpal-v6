<template>
  <div class="field-setting">
    <div class="field-setting-header">
      <h3 class="title">{{ $t('contactBook.fields') }}</h3>
    </div>

    <div class="field-list">
      <el-tag v-for="field in existingFields" :key="field.value" :closable="!field.disabled && mode !== 'edit'" @close="handleClose(field)">
        {{ field.name }}
      </el-tag>
    </div>
    <el-button style="width: fit-content" type="default" size="small" :icon="Plus" :disabled="loading" @click="handleAddField">
      {{ $t('button.add', { name: $t('contactBook.field') }) }}
    </el-button>

    <!-- Add Field Dialog -->
    <FieldSettingDialog v-model="showAddDialog" :existingFields="existingFields" @confirm="handleAddFieldConfirm" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import FieldSettingDialog from './fieldSettingDialog.vue'
import { clientApi } from 'api'
const props = defineProps<{
  mode: 'edit' | 'create'
  id: string
}>()

interface Field {
  name: string
  value: string
}
const emits = defineEmits(['refresh'])
// Reactive data
const showAddDialog = ref(false)
const loading = ref(false)

const existingFields = ref<Field[]>([
  { name: 'Name', value: 'name', disabled: true },
  { name: 'Email', value: 'email', disabled: true }
])

// Event handlers
function handleAddField() {
  showAddDialog.value = true
}

async function handleAddFieldConfirm(field: Field) {
  if (props.mode === 'edit') {
    try {
      loading.value = true
      await clientApi.api.postDmsContactGroupIdNewfields(props.id, field)
    } catch (error) {
      return
    } finally {
      loading.value = false
      emits('refresh')
    }
  }
  // Add the new field to existing fields
  existingFields.value.push(field)
  console.log(props.mode, 'New field added:', field)
}

function handleClose(field: Field) {
  const index = existingFields.value.findIndex((item: Field) => item.value === field.value)
  if (index !== -1) {
    existingFields.value.splice(index, 1)
  }
  // Add your field click logic here
}
function getFieldData() {
  return existingFields.value.filter((item: Field) => !item.disabled)
}
function setFieldData(fields: Field[]) {
  existingFields.value = fields
}
defineExpose({ getFieldData, setFieldData })
</script>

<style lang="scss" scoped>
.field-setting-header {
  margin-bottom: var(--app-space-s);

  .title {
    margin: 0;
    color: #333;
    font-size: var(--app-font-size-l);
    font-weight: 600;
  }
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: var(--app-space-s);
}

</style>
