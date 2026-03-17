<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { useWorkflowAdditionalContext } from '@packages/workflow/composables/useWorkflow'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { getVariablesByType } = useVariablesProvide()
const autoAssignField = ref<string>('')
function refreshData() {
  const data = node.getData()
  if (!!data.assignee) {
    autoAssignField.value = data
  } else {
    autoAssignField.value = undefined
  }
}

function assigneeChanged(newVal: string) {
  const data = node.getData()
  const newData = {
    ...data,
    assignee: newVal,
    version: node.data.version + 1 || 0
  }

  node.setData(newData, { overwrite: true, deep: true })
}

const allFields = computed(() => {
  return getVariablesByType('string')
})

onMounted(async () => {
  useWorkflowAdditionalContext(refreshData)
})

watch(
  () => node,
  () => {
    if (node) {
      refreshData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <ElForm label-position="top" label-width="100px" size="small">
    <ElFormItem label="Auto Assignee">
      <ElSelect v-model="autoAssignField" placeholder="Select Field" filterable clearable :disabled="graphProvider.readonly.value" @change="assigneeChanged">
        <ElOption v-for="option in allFields" :key="option.id" :label="option.name" :value="option.id" />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>
