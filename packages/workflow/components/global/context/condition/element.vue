<script setup lang="ts">
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { element } = defineProps<{
  element: any
}>()
const { getVariablesByDisplayTypes } = useVariablesProvide()
const emits = defineEmits(['delete', 'update'])
const formData = ref<{
  type: 'is_null' | 'string_validation' | 'numbering_validation' | 'bool_validation'
  val_type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  field: string
  condition: 'contains' | '==' | '>' | '>=' | '<' | '<=' | 'is_null'
  value: string | number | boolean | null | []
}>({
  type: 'string_validation',
  val_type: 'string',
  field: '',
  condition: '==',
  value: ''
})
const selectedType = computed(() => {
  return formData.value?.type || 'string_validation'
})

function getVariables(type: string) {
  let displayTypes: any[]
  switch (type) {
    case 'is_null':
      displayTypes = []
      break
    case 'string_validation':
      displayTypes = ['text']
      break
    case 'numbering_validation':
      displayTypes = ['number']
      break
    case 'bool_validation':
      displayTypes = ['boolean']
      break
    default:
      displayTypes = []
  }
  return getVariablesByDisplayTypes(displayTypes)
}

const typeOptions = ref([
  {
    label: 'Is Empty',
    value: 'is_null',
    condition: [
      { label: 'Is Null', value: 'is_null' }
      // { label: 'Not Null', value: 'notNull' }
    ]
  },
  {
    label: 'String Validation',
    value: 'string_validation',
    condition: [
      { label: 'Contains', value: 'contains' },
      { label: 'Equal', value: '==' }
    ]
  },
  {
    label: 'Numbering Validation',
    value: 'numbering_validation',
    condition: [
      { label: 'Equal', value: '==' },
      { label: 'Is Greater Than', value: '>' },
      { label: 'Greater Than Or Equal', value: '>=' },
      { label: 'Is Less Than', value: '<' },
      { label: 'Less Than Or Equal', value: '<=' }
    ]
  },
  { label: 'Boolean Validation', value: 'bool_validation', condition: [{ label: 'Equal', value: '==' }] }
])
const conditionOption = computed(() => {
  return typeOptions.value.find((item: any) => item.value === formData.value?.type)?.condition || []
})

function typeChange() {
  formData.value.field = ''
  formData.value.condition = '=='
  switch (selectedType.value) {
    case 'is_null':
      formData.value.condition = 'is_null'
      formData.value.val_type = 'string'
      formData.value.value = ''
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
  update()
}

function fieldChange(type: string) {
  if (type !== 'is_null') return

  const v_list = getVariables(type)
  const find = v_list.find((item) => item.id === formData.value.field)
  if (!!find) {
    formData.value.val_type = find.type
    if (find.type === 'array') {
      formData.value.value = []
    } else if (find.type === 'number' || find.type === 'boolean' || find.type === 'object') {
      formData.value.value = null
    } else {
      formData.value.value = ''
    }
  } else {
    formData.value.val_type = 'string'
    formData.value.value = ''
  }
  update()
}

function update() {
  emits('update', formData.value)
}

watch(
  () => element,
  () => {
    if (!element) return
    if (JSON.stringify(element) !== JSON.stringify(formData.value)) {
      formData.value = JSON.parse(JSON.stringify(element))
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
        <el-select v-model="formData.type" placeholder="Select form type" filterable @change="typeChange">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Field" prop="id">
        <el-select v-model="formData.field" placeholder="Select form field" filterable @change="fieldChange(formData.type)">
          <el-option v-for="item in getVariables(formData.type)" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Condition" prop="condition">
        <el-select v-model="formData.condition" placeholder="Select form condition" filterable @change="update">
          <el-option v-for="condition in conditionOption" :key="condition.value" :label="condition.label" :value="condition.value" />
        </el-select>
      </el-form-item>

      <template v-if="!!selectedType">
        <template v-if="selectedType === 'string_validation'">
          <el-form-item label="Value" prop="value">
            <el-input v-model="formData.value" @change="update" />
          </el-form-item>
        </template>
        <template v-if="selectedType === 'numbering_validation'">
          <el-form-item label="Value" prop="value">
            <el-input-number v-model="formData.value" @change="update" />
          </el-form-item>
        </template>
        <template v-if="selectedType === 'bool_validation'">
          <el-form-item label="Value" prop="value">
            <el-switch v-model="formData.value" active-text="True" inactive-text="False" @change="update" />
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
