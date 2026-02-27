<template>
  <div class="grid-layout_3">
    <el-form-item v-for="(item, index) in workflowProps" :key="index" :label="getTargetLabel(item.label)">
      <ElSelect v-model="item.source" filterable :placeholder="$t('easyform.actionFieldSelect')" clearable>
        <ElOption v-for="option in varList" :key="option.value" :label="option.label" :value="option.value" />
      </ElSelect>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { newAdminApi } from 'api'
const props = defineProps<{
  workflow: string
  varList: any[]
  setting: any[]
}>()
const workflowProps = ref([])
function getTargetLabel(value) {
  const index = props.varList.findIndex((i) => i.label === value)
  return index === -1 ? value : props.varList[index].label
}
async function getWorkflowProps(processKey: string) {
  try {
    const options = await newAdminApi.postDocpalWorkflowProperties({ processKey }).then((res) => res.data)
    return options.map((item) => ({
      label: item.name,
      value: item.id
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}
function getData() {
  return workflowProps.value.reduce((acc, item) => {
    if (item.source) {
      acc.push({
        source: item.source,
        target: item.value
      })
    }
    return acc
  }, [])
}
watch(
  () => props.workflow,
  async (newVal) => {
    if (newVal) {
      workflowProps.value = await getWorkflowProps(newVal)
      if (props.setting?.workflow_mapping) {
        props.setting?.workflow_mapping.forEach((item) => {
          const index = workflowProps.value.findIndex((i) => i.value === item.target)
          if (index !== -1) {
            workflowProps.value[index].source = item.source
          }
        })
      }
    }
  },
  { immediate: true }
)
defineExpose({
  getData
})
</script>

<style scoped lang="scss">
.grid-layout_3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--app-space-xs);
}
</style>
