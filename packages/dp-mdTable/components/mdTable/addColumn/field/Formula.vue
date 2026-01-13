<template>
  <div>
    <el-form-item label="Formula">
      <el-input v-model="formData.formula" @click="handleFormulaClick" />
    </el-form-item>
    <MdTableAddColumnFieldFormulaDialog v-model="dialogVisible" :formData="formData" @confirm="handleFormulaConfirm" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
}>()
function count(a, b) {
  return a * b
}
function add(a, b) {
  return a + b
}
const str = 'add(count(100,2),3)'
const dialogVisible = ref(false)
const formulaDialogRef = ref()
function handleFormulaClick() {
  dialogVisible.value = true
}
function handleFormulaConfirm(formula: string) {
  console.log('handleFormulaConfirm', formula)
}
</script>
