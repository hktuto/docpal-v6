<script setup lang="ts">
import type { Edge } from '@antv/x6'

const { node: edge } = defineProps<{
  node: Edge
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { t } = useI18n()
const formData = ref({
  type: 'conditional',
  condition: '',
  priority: 1
})

const gatewayType = ['ExclusiveGateway_', 'ParallelGateway_', 'InclusiveGateway_']

const showCondition = computed(() => {
  // if (edge.data.source_node_id.includes('ExclusiveGateway_')) {
  //   return false
  // }
  return true
})

const showPriority = computed(() => {
  return edge.data.source_node_id.includes('InclusiveGateway_')
})

function init(){
  const data = edge.getData()
  data.flow_control
}

function updateData(){
  graphProvider?.graph.value?.startBatch('update-gateway-edge-data')
  const data = edge.getData()

  const newData = {
    ...data,
    flow_control: formData.value
  }
  edge.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-gateway-edge-data')
}

watch(formData,()=>{
  if (edge.getData().flow_control !== formData.value){
    updateData()
  }
},{
  deep: true
})

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
  <el-form label-position="top">
    <el-form-item v-if="showCondition" :label="t('Condition')">
      <el-input v-model="formData.condition" />
    </el-form-item>
    <el-form-item v-if="showPriority" :label="t('Priority')">
      <el-input-number style="width: 100%" v-model="formData.priority" controls-position="right" :min="1" :max="10" :precision="0" />
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss"></style>
