<script setup lang="ts">
const props = defineProps<{
  targetOptions: any[]
}>()
const formData = ref({
  condition: 'or',
  resourceRules: []
})
const SelectorRoleRef = ref()
async function setFormData(data) {
  if (!data) {
    formData.value = {
      condition: 'or',
      resourceRules: [
        {
          attribute: '',
          value: [],
          condition: 'eq',
          type: 'string'
        }
      ]
    }
    return
  }
  while (props.targetOptions.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  formData.value = {
    condition: 'or',
    resourceRules: data?.map((item: any) => {
      return {
        attribute: item.attribute,
        value: [item.value],
        condition: item.condition === 'equal' ? 'eq' : 'neq',
        type: props.targetOptions.find((attr) => attr.value === item.attribute)?.type
      }
    }) || []
  }
  formData.value.resourceRules.forEach((item: any) => {
    SelectorRoleRef.value.onResourceAttributeChange(item, item.attribute, true)
  })
}
function getFormData() {
  return formData.value.resourceRules.map((item: any) => {
    return {
      attribute: item.attribute,
      value: item.value[0],
      condition: item.condition === 'eq' ? 'equal' : 'not_equal' // 1=includes
    }
  })
}

defineExpose({
  setFormData,
  getFormData
})
</script>
<template>
  <h3>
    {{ $t('user_role') }}
  </h3>
  <FormLogicalSelector ref="SelectorRoleRef" v-model:form-data="formData" :resource-attributes="targetOptions" :is-or="true" />
</template>
