<script setup lang="ts">
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { element } = defineProps<{
  element: any
}>()
const { getVariablesByType } = useVariablesProvide()

const formData = ref<{
  type: 'is_null' | 'string_validation' | 'numbering_validation' | 'bool_validation'
  val_type: 'is_null' | 'string' | 'number' | 'boolean'
  field: string
  condition: 'contains' | 'is' | 'eq' | 'gt'
  value: string | number | boolean
}>()
const selectedType = computed(() => {
  return formData.value?.type || 'string_validation'
})

const allVariables = computed(() => {
  let typeList = []
  if (formData.value?.val_type === 'is_null') {
    typeList = []
  } else {
    typeList.push(formData.value?.val_type)
  }

  return getVariablesByType(typeList)
})
const defCondition = [{ label: 'Contains', value: 'contains' }]
const typeOptions = ref([
  { label: 'Is Empty', value: 'is_null', condition: defCondition },
  { label: 'String Validation', value: 'string_validation', condition: defCondition },
  {
    label: 'Numbering Validation',
    value: 'numbering_validation',
    condition: [...defCondition, { label: 'Is Greater Than', value: 'eq' }, { label: 'Is Less Than', value: 'gt' }]
  },
  { label: 'Boolean Validation', value: 'bool_validation', condition: defCondition }
])
const conditionOption = computed(() => {
  return typeOptions.value.find((item: any) => item.value === formData.value?.type)?.condition || []
})

function typeChange() {
  formData.value.field = ''
  formData.value.condition = 'contains'
  switch (selectedType.value) {
    case 'is_null':
      formData.value.val_type = 'is_null'
      formData.value.value = 'null'
      break
    case 'string_validation':
      formData.value.val_type = 'string'
      formData.value.value = ''
      break
    case 'numbering_validation':
      formData.value.val_type = 'number'
      formData.value.value = 0
      break
    case 'bool_validation':
      formData.value.val_type = 'boolean'
      formData.value.value = true
      break
    default:
  }
  console.log(222, formData.value)
}

watch(
  () => element,
  () => {
    if (!element) return
    if (JSON.stringify(element) !== JSON.stringify(formData.value)) {
      formData.value = deepCopy(element)
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <div class="elementContainer">
    <div v-if="!graphProvider.readonly.value" class="removeConditionContainer">
      <Icon name="lucide:trash" @click="$emit('delete')" />
    </div>
    <el-form :disabled="graphProvider.readonly.value" label-position="top" size="small">
      <el-form-item label="Type" prop="type">
        <el-select v-model="formData.type" placeholder="Select form field" filterable clearable @change="typeChange">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Field" prop="id">
        <el-select v-model="formData.field" placeholder="Select form field" filterable clearable>
          <el-option v-for="item in allVariables" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Condition" prop="condition">
        <el-select v-model="formData.condition" placeholder="Select form field" filterable clearable>
          <el-option v-for="condition in conditionOption" :key="condition.value" :label="condition.label" :value="condition.value" />
        </el-select>
      </el-form-item>

      <template v-if="!!selectedType">
        <template v-if="selectedType === 'is_null'">
          <el-form-item label="Value" prop="value">
            <el-select v-model="formData.value" placeholder="Select" filterable clearable>
              <el-option
                v-for="(item, index) in [
                  { label: 'Is Null', value: 'null' },
                  { label: 'Not Null', value: 'notNull' }
                ]"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </template>
        <template v-if="selectedType === 'string_validation'">
          <el-form-item label="Value" prop="value">
            <el-input v-model="formData.value" />
          </el-form-item>
        </template>
        <template v-if="selectedType === 'numbering_validation'">
          <el-form-item label="Value" prop="value">
            <el-input-number v-model="formData.value" />
          </el-form-item>
        </template>
        <template v-if="selectedType === 'bool_validation'">
          <el-form-item label="Value" prop="value">
            <el-switch v-model="formData.value" active-text="True" inactive-text="False" />
          </el-form-item>
        </template>
      </template>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.elementContainer {
  width: 100%;
  position: relative;
}

:deep(.el-form-item--small) {
  margin-bottom: var(--app-space-xs);
}

:deep(.el-form-item__label) {
  margin-bottom: var(--app-font-size-xxs);
}

:deep(.el-input-number--small) {
  width: 100%;
}

.removeConditionContainer {
  position: absolute;
  top: var(--app-space-xs);
  right: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-s);
}
</style>
