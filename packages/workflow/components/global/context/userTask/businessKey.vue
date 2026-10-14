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
const { t } = useI18n()
const businessKey = ref<string>('')
const { getVariablesByDisplayTypes } = useVariablesProvide()
const stringVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['text'], true)
})

function init() {
  const nodeData = node.getData()
  if (!!nodeData.business_key) {
    businessKey.value = nodeData.business_key
  } else {
    businessKey.value = ''
  }
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-boolean-button-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    business_key: businessKey.value,
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-boolean-button-data')
}

watch(
  () => node,
  () => {
    if (node) {
      init()
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <el-form-item :label="t('Business Key')" label-position="top">
    <el-select v-model="businessKey" filterable :placeholder="t('common_selectOccupancyContent')" @change="updateData">
      <el-option v-for="item in stringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
  </el-form-item>
</template>

<style scoped lang="scss"></style>
