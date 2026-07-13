<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const jsonData = ref({})

function init() {
  jsonData.value = node.getData()
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-script-field-data')

  const data = node.getData()
  const newData = {
    ...jsonData.value,
    version: (data.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-script-field-data')
}

function handleSave() {
  updateData()
}

watch(
  () => node,
  async () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-button @click="handleSave">Save</el-button>
</template>

<style scoped lang="scss"></style>
