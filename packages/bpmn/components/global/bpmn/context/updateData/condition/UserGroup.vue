<script lang="ts" setup>
import { getGroupsSelectOption } from '#imports'

const condition = defineModel<any>('condition', { required: true })
const { disabled } = defineProps<{
  disabled: boolean
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw new Error('Missing provider')
}

const userGroupList = ref<any[]>([])

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text')
})

onMounted(async () => {
  userGroupList.value = await getGroupsSelectOption()
})

</script>

<template>
  <ElFormItem label="Form Info">
    <ElSelect v-model="condition.attr_updateFieldName" placeholder="Form Info" :disabled="disabled">
      <el-option v-for="item in stringFields" :key="item.id" :label="item.name" :value="item.id" />
    </ElSelect>
  </ElFormItem>
  <ElFormItem label="User Group">
    <ElSelect v-model="condition.attr_value" placeholder="User Group" :disabled="disabled">
      <ElOption v-for="item in userGroupList" :key="item.value" :label="item.label" :value="item.value" />
    </ElSelect>
  </ElFormItem>
</template>