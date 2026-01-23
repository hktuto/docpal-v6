<template>
  <div class="custom-checkbox-cell" :class="{ 'is-checked': row.checked }">
    <span class="row-index">{{ seq }}</span>
    <el-checkbox v-model="row.checked" class="row-checkbox" @change="handleCheckboxChange(row)"></el-checkbox>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  seq: number
  row: any
  rowIndex: number
  props: any
}>()
const { gridRef } = useMDTableInject()
const handleCheckboxChange = (row) => {
  console.log('handleCheckboxChange', row)
  gridRef.value?.toggleCheckboxRow(row)
}
</script>
<style lang="scss" scoped>
.custom-checkbox-cell {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-index {
  display: inline-block;
}

.row-checkbox {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.custom-checkbox-cell:hover .row-checkbox,
.custom-checkbox-cell.is-checked .row-checkbox {
  opacity: 1;
}

.custom-checkbox-cell:hover .row-index,
.custom-checkbox-cell.is-checked .row-index {
  opacity: 0;
}
</style>
