<script setup lang="ts">
const { dataMapping: propsDataMapping } = defineProps<{
  dataMapping: any
}>()
const { t } = useI18n()
const { getVariablesByDisplayTypes } = useVariablesProvide()
const variablesByType = getVariablesByDisplayTypes()

const variableList = computed(() => {
  const usedKeySet = new Set(Object.keys(propsDataMapping ?? {}))
  return variablesByType.filter((item: any) => !item.id.startsWith('__system__') && !usedKeySet.has(item.id))
})

const mappingVariableList = computed(() => {
  return getVariablesByDisplayTypes([],true)
})

const emits = defineEmits(['create'])
const dialogVisible = ref(false)
const dataMapping = ref<{
  key: string
  value: string[]
}>({
  key: '',
  value: []
})
const variableVisibleSelect = ref<string>('')
const rules = reactive({
  key: [{ required: true, message: 'Please select mapping key', trigger: 'change' }],
  value: [{ required: true, message: 'Please input mapping rule', trigger: 'blur' }]
})
const formRef = ref()

function open() {
  dialogVisible.value = true
  nextTick(() => {
    formRef.value.resetFields()
  })
}

function handleAddVariableVisible() {
  if (!variableVisibleSelect.value || variableVisibleSelect.value === '') return
  dataMapping.value.value.push(variableVisibleSelect.value)
  variableVisibleSelect.value = ''
}
function handleShowTags(value: string) {
  const variable = mappingVariableList.value.find((item: any) => item.id === value)
  if (variable) {
    return variable.name
  }
  return value
}

function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      emits('create', { [dataMapping.value.key]: dataMapping.value.value.join('') })
      dialogVisible.value = false
    }
  })
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog v-model="dialogVisible" title="Data Mapping" append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" :model="dataMapping" :rules="rules" label-position="top">
      <el-form-item label="Mapping Key" prop="key">
        <el-select v-model="dataMapping.key" placeholder="Select Mapping Key" filterable>
          <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Mapping Rule" prop="value">
        <el-input-tag
          v-model="dataMapping.value"
          draggable
          clearable
          tag-effect="dark"
          tag-type="success"
        >
          <template #tag="{ value, index }">
            <span>{{ handleShowTags(value) }}</span>
          </template>
        </el-input-tag>
      </el-form-item>
      <div class="input-button-mapping">
        <el-select v-model="variableVisibleSelect" filterable>
          <el-option v-for="item in mappingVariableList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-button @click="handleAddVariableVisible">Add Variable</el-button>
      </div>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.input-button-mapping {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>
