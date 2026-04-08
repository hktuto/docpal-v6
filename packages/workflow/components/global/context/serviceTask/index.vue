<script setup lang="ts">
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()

const formData = ref<{
  type: string
}>({
  type: ''
})

const serviceTaskTypeList = ref([
  {
    label: 'Service Task',
    value: 'ServiceTask'
  }
])


</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top">
    <el-form-item :label="t('Service Task Type')">
      <el-select v-model="formData.type">
        <el-option v-for="item in serviceTaskTypeList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </el-form>



</template>

<style scoped lang="scss"></style>
