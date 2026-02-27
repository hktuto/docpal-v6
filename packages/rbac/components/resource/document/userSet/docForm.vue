<script setup lang="ts">
import { newAdminApi } from 'api'
const { t } = useI18n()
const ConditionEnum = {
  eq: '=',
  neq: '!='
}
const formData = ref({
  condition: 'or',
  resourceRules: []
})
const documentSetting = {
  label: t('dpTable_documentType'),
  value: 'document_type',
  type: 'select-dynamic',
  selectConfig: {
    type: 'document'
  }
}
let metadataOpts: any = []
const resourceAttributes = ref([])
async function getMetadata() {
  try {
    if (metadataOpts.length === 0) {
      metadataOpts = await newAdminApi.getDmsDocpalTypeCache().then((res: any) => res.data)
    }
    const optionList = metadataOpts.map((item: any) => {
      const extraProps = {
        type: 'string'
      }
      switch (item.dataType) {
        case 'select':
          extraProps.type = 'select'
          extraProps.selectConfig = {
            options: item.validationRule.options.map((item: any) => ({
              label: item,
              value: item
            }))
          }
          break
        case 'user':
        case 'user_role_user_group':
        case 'mastertable':
          extraProps.type = 'select-dynamic'
          extraProps.selectConfig = {
            type: item.dataType,
            ...item.validationRule
          }
          extraProps.selectOptions = []
          break
        case 'number':
          extraProps.type = 'number'
          break
        case 'boolean':
          extraProps.type = 'boolean'
          break
        default:
          extraProps.type = 'string'
      }
      return {
        ...extraProps,
        label: t(item.name),
        value: item.name,
        tag: item.dataType
      }
    })
    resourceAttributes.value.push(...optionList)
  } catch (error) {}
}
function getKeyByValue(obj: any, value: any) {
  return Object.entries(obj).find(([key, val]) => val === value)?.[0]
}
const SelectorDocTypeRef = ref()
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
  while (metadataOpts.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const newFormData = {
    condition: 'or',
    resourceRules: data.rules.map((item: any) => {
      return {
        attribute: item.attributeName,
        value: Array.isArray(item.attributeValue) ? item.attributeValue : [item.attributeValue],
        condition: getKeyByValue(ConditionEnum, item.operator),
        type: resourceAttributes.value.find((attr) => attr.value === item.attributeName)?.type
      }
    })
  }
  formData.value = newFormData
  formData.value.resourceRules.forEach((item: any) => {
    SelectorDocTypeRef.value.onResourceAttributeChange(item, item.attribute, true)
  })
}
function getFormData() {
  const params = {
    operator: formData.value.condition === 'or' ? 'OR' : 'AND',
    rules: formData.value.resourceRules.map((item: any) => {
      return {
        attributeType: item.attribute === 'document_type' ? 2 : 1,
        attributeName: item.attribute,
        operator: ConditionEnum[item.condition],
        attributeValue: item.type === 'boolean' ? item.value : item.value.length > 1 ? item.value : item.value[0]
      }
    })
  }
  return params
}
onMounted(() => {
  resourceAttributes.value.push({ ...documentSetting })
  getMetadata()
})
defineExpose({
  setFormData,
  getFormData
})
</script>
<template>
  <h3 class="mb-2">
    {{ $t('rbac.permission.resource_rules') }}
  </h3>
  <FormLogicalSelector ref="SelectorDocTypeRef" v-model:form-data="formData" :resource-attributes="resourceAttributes" :is-or="true" />
</template>
