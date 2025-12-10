<script lang="ts" setup>
const condition = defineModel<any>('condition', { required: true })
const { disabled } = defineProps<{
  disabled: boolean
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw new Error('Missing provider')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule
const infoType = ref('other')
const functionOptionsMap = {
  boolean: ['Set_Value', 'Toggle'],
  long: ['Increase_By', 'Decrease_By', 'Set_Value'],
  other: ['Set_Value']
}
function functionChange(newFn) {
  if (['Set_Value', 'Toggle'].includes(newFn)) {
    delete condition.value.attr_step
  } else {
    delete condition.value.attr_value
  }
}

const allFields = computed(() => {
  // return Object.keys(graphProvider.allFormField.value).map((key: string) => {
  //   return graphProvider.allFormField.value[key]
  // })
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value
})

function handleInfoChange(info: any, isChange: boolean) {
  const infoItem = allFields.value.find((item) => item.id === info)
  infoType.value = ['boolean', 'number'].includes(infoItem.validationRule.type) ? infoItem.validationRule.type : 'other'
  if (isChange) condition.value.attr_function = 'Set_Value'
}
watch(
  () => condition.value.attr_updateFieldName,
  (newValue, oldValue) => {
    if (!!newValue) handleInfoChange(newValue, !!oldValue)
  },
  {
    immediate: true
  }
)
</script>

<template>
  <ElFormItem label="Form Info">
    <ElSelect v-model="condition.attr_updateFieldName" placeholder="Form Info" :disabled="disabled">
      <ElOption v-for="item in allFields" :key="item.id" :label="item.name" :value="item.id" />
    </ElSelect>
  </ElFormItem>
  <ElFormItem label="Function">
    <ElSelect v-model="condition.attr_function" placeholder="Function" @change="functionChange" :disabled="disabled">
      <ElOption v-for="item in functionOptionsMap[infoType]" :key="item" :label="item" :value="item" />
    </ElSelect>
  </ElFormItem>
  <ElFormItem v-if="infoType === 'long' && condition.attr_function !== 'Set_Value'" label="Step">
    <ElInputNumber v-model="condition.attr_step" step="1" :disabled="disabled" controls-position="right" style="width: 100%" />
  </ElFormItem>
  <ElFormItem v-else-if="infoType === 'long'" label="Value">
    <ElInputNumber v-model="condition.attr_value" step="1" :disabled="disabled" controls-position="right" style="width: 100%" />
  </ElFormItem>
  <ElFormItem v-else-if="infoType === 'boolean' && condition.attr_function === 'Set_Value'" label="Value">
    <ElSwitch v-model="condition.attr_value" />
  </ElFormItem>
  <ElFormItem v-else-if="infoType !== 'boolean'" label="Value">
    <ElInput v-model="condition.attr_value" />
  </ElFormItem>
  <ElFormItem v-else label="Value">
    <ElInput v-model="condition.attr_value" :disabled="disabled" />
  </ElFormItem>
</template>
