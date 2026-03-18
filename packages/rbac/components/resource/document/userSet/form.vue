<script setup lang="ts">
const props = defineProps<{
  targetOptions: any[]
}>()
const formData = ref({
  condition: 'or',
  resourceRules: []
})

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
        attribute: item.memberType,
        value: [item.memberId],
        condition: item.operator === 1 ? 'eq' : 'neq',
        type: props.targetOptions.find((attr) => attr.value === item.memberType)?.type
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
      memberType: item.attribute,
      memberId: item.value[0],
      operator: item.condition === 'eq' ? 1 : 2 // 1=includes, 2=not includes
    }
  })
}
const SelectorRoleRef = ref()

defineExpose({
  setFormData,
  getFormData
})
</script>
<template>
  <h3>
    {{ $t('rbac.permission.user_rules') }}
  </h3>
  <FormLogicalSelector ref="SelectorRoleRef" v-model:form-data="formData" :resource-attributes="targetOptions" :is-or="true" />
</template>
