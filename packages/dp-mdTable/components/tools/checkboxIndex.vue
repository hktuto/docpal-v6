<template>
  <div class="custom-checkbox-cell" :class="{ 'is-checked': row.checked }">
    <span class="row-index">{{ seq }}</span>
    <el-checkbox v-model="row.checked" class="row-checkbox" @change="handleCheckboxChange(row)"></el-checkbox>
    <div class="expand-icon" @click="handleExpandClick(row)">
      <Icon name="lucide:expand" />
    </div>
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
const emit = defineEmits<{
  'expand-click': [row: any]
}>()
const handleExpandClick = (row: any) => {
  emit('expand-click', row)
}
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
  justify-content: flex-end;
}

.row-index {
  display: inline-block;
}

.row-checkbox {
  position: absolute;
  right: 0%;
  top: 50%;
  transform: translate(0%, -50%);
  opacity: 0;
  transition: opacity 0.3s;
}
.expand-icon{
  position: absolute;
  left: 0px;
  top: 50%;
  height: 100%;
  transform: translate(0, -50%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.custom-checkbox-cell:hover .row-checkbox,
.custom-checkbox-cell.is-checked .row-checkbox,
.custom-checkbox-cell:hover .expand-icon,
.row--hover .expand-icon,
.row--hover .row-checkbox,
.row--checked .row-checkbox{
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}

.custom-checkbox-cell:hover .row-index,
.custom-checkbox-cell.is-checked .row-index {
  opacity: 0;
}
</style>
