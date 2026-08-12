<script setup lang="ts">

import { ref } from 'vue'

const props = defineProps<{
  selectedColumn: string | undefined,
  batchEditDialogVisible: boolean,
  applyBatchEdit: (val: string) => void
}>()
const emit = defineEmits<{
  'update:batchEditDialogVisible': [boolean]
}>()
const dialogVisible = computed({
  get: () => {
    inputValue.value = ""
    return props.batchEditDialogVisible
  },
  set: (value) => {
    if(value) {
      inputValue.value = ""
    }
    emit('update:batchEditDialogVisible', value)
  },
})

const inputValue = ref('')


</script>

<template>
    <el-dialog v-model="dialogVisible">
        <ElInput v-model="inputValue" style="margin-bottom: 1rem;" />
        <ElButton type="primary" @click="applyBatchEdit(inputValue)">Apply</ElButton>
    </el-dialog>
</template>
