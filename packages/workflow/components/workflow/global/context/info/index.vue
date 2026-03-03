<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}

const form = ref({
  name: ''
})
const FormRef = ref()

function nameChange(val: string) {
  graphProvider?.graph.value?.startBatch('update-name')

  node.setData(
    {
      ...node.data,
      version: (node.data.version || 0) + 1,
      name: val,
      data: {
        ...node.data.data,
        attr_name: val
      }
    },
    { overwrite: true, deep: true, silent: false }
  )

  graphProvider?.graph.value?.stopBatch('update-name')
}

function refreshData() {
  const data = node.getData()
  form.value.name = data.data.attr_name
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}

onMounted(() => {
  setUpListener()
  refreshData()
})
</script>

<template>
  <el-form ref="FormRef" label-position="top" :model="form" @submit.stop="() => {}">
    <el-formItem label="Name" prop="name" :rules="[{ required: true, message: 'Workflow Name is required' }]">
      <el-input v-model="form.name" @change="nameChange" :disabled="editorProvider.readonly.value" placeholder="Name" />
    </el-formItem>
    <el-divider />
    <WorkflowContextInfoRule />
  </el-form>
</template>
