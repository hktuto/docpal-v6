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
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form>
    <el-form-item :label="t('Service Task Type')">
      <el-select v-model="formData.type">
        <el-option />
      </el-select>
    </el-form-item>
  </el-form>



</template>

<style scoped lang="scss"></style>
