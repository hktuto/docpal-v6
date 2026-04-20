<template>
  <el-dialog :model-value="visible" @close="handleClose" title="Select Variable" width="500px">
    <div class="table-style">
      <el-table
        :data="variables"
        @row-click="handleSelect"
        highlight-current-row
        :row-class-name="rowClassName"
        style="margin-bottom: 1rem;"
      >
        <el-table-column prop="name" label="Name" />
        <el-table-column prop="type" label="Type"/>
        <el-table-column prop="displayValue" label="Display Value" />
      </el-table>
    </div>
    <template #footer>
      <el-button type="primary" :disabled="!selected" @click="handleInsert" v-tooltip="!selected ? 'Select a variable' : ''">Insert</el-button>
      <el-button @click="handleClose">Cancel</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, inject } from 'vue'
import { DocTemplateProveKey } from '../../../../../utils/docTemplateHelper'
import type { DocTemplateVariable } from '../../../../../utils/docTemplateHelper'

const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{
  (e: 'select', variable: DocTemplateVariable): void
  (e: 'close'): void
}>()

const docTemplateCtx = inject(DocTemplateProveKey)
const variables = docTemplateCtx?.variables || []

const selected = ref<DocTemplateVariable | null>(null)

function handleSelect(row: DocTemplateVariable) {
  selected.value = row
}

function handleInsert() {
  if (selected.value) {
    emit('select', selected.value)
    selected.value = null
  }
}

function handleClose() {
  emit('close')
  selected.value = null
}

function rowClassName({ row }: { row: DocTemplateVariable }) {
  return selected.value && row.key === selected.value.key ? 'selected-row' : ''
}
</script>

<style lang="scss" scoped>
.selected-row {
  background: #e6f7ff !important;
}
.table-style{
  height: 500px;
  overflow-y: auto;
}
</style> 
