<script setup lang="ts">
import type { Edge } from '@antv/x6'

const { node: edge } = defineProps<{
  node: Edge
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const text = ref('')
const conditionStatus = ref<boolean>()

function init() {
  const metadata = edge.getData().metadata
  text.value = metadata.label
  conditionStatus.value = metadata.conditionStatus === 'success'
}

function update() {
  graphProvider?.graph.value?.startBatch('update-condition-edge-data')
  const nodeData = edge.getData()
  const newData = {
    ...nodeData,
    metadata: {
      ...nodeData.metadata,
      label: text.value
    },
    version: (nodeData.version || 0) + 1
  }

  edge.setData(newData, { overwrite: true, deep: true })
  edge.setLabels([{ attrs: { label: { text: text.value } } }])
  graphProvider?.graph.value?.stopBatch('update-condition-edge-data')
}

watch(
  () => edge,
  async () => {
    if (edge) {
      init()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <p>Condition Task Status</p>
  <el-form-item label-position="top" :label="conditionStatus ? 'Success Label' : 'Failure Label'">
    <el-input v-model="text" @change="update" />
  </el-form-item>
</template>

<style scoped lang="scss"></style>
