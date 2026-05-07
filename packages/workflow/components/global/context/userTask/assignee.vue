<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { getUserSelectOption } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('provider not found')
}
const { getVariablesByType } = useVariablesProvide()
const autoAssignField = ref<string>('')
const assignFieldList = ref<any[]>([])

function initData() {
  const data = node.getData()
  if (!!data.config?.human_task?.assignee) {
    autoAssignField.value = data.config?.human_task?.assignee
  } else {
    autoAssignField.value = '${__system__user_creator_id}'
  }
}

function assigneeChanged(newVal: string) {
  graphProvider?.graph.value?.startBatch('update-form-assignee-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      human_task: {
        ...nodeData.config.human_task,
        assignee: newVal
      }
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-form-assignee-data')
}

async function getAssignFieldList() {
  const stringVariables = getVariablesByType(['string'], true)
  const userList = await getUserSelectOption()

  assignFieldList.value = [
    {
      label: 'Variables',
      options: stringVariables
    },
    {
      label: 'User',
      options: userList.map((item: any) => ({
        id: item.value,
        name: item.label
      }))
    }
  ]
}

onMounted(async () => {
  await getAssignFieldList()
  // useWorkflowAdditionalContext(initData)
})

watch(
  () => node,
  () => {
    if (node) {
      initData()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top" label-width="100px" size="small">
    <el-form-item label="Auto Assignee" required>
      <el-select v-model="autoAssignField" placeholder="Select Field" filterable :disabled="graphProvider.readonly.value" @change="assigneeChanged">
        <el-option-group v-for="group in assignFieldList" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style lang="scss" scoped></style>
