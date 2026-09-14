<script setup lang="ts">
import { DocTemplateProveKey } from '../../../../../utils/docTemplateHelper'
import type { DocTemplateVariable } from '../../../../../utils/docTemplateHelper'

const visible = ref<boolean>(false)
const emit = defineEmits<{ (e: 'select', variable: DocTemplateVariable): void }>()
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

function rowClassName({ row }: { row: DocTemplateVariable }) {
  return selected.value && row.id === selected.value.id ? 'selected-row' : ''
}

function open() {
  visible.value = true
}

defineExpose({ open })
</script>

<template>
  <el-dialog :model-value="visible" title="Select Variable" @close="visible = false" width="500px" destroy-on-close>
    <div class="table-style">
      <el-table :data="variables" @row-click="handleSelect" highlight-current-row :row-class-name="rowClassName" style="margin-bottom: 1rem">
        <el-table-column prop="name" label="Name" />
        <el-table-column prop="type" label="Type" />
        <el-table-column prop="value" label="Display Value" />
      </el-table>
    </div>
    <template #footer>
      <el-button type="primary" :disabled="!selected" @click="handleInsert" v-tooltip="!selected ? 'Select a variable' : ''">Insert</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.selected-row {
  background: #e6f7ff !important;
}
.table-style {
  height: 500px;
  overflow-y: auto;
}
</style>
