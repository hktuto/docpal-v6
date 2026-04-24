<template>
  <div class="custom-checkbox-cell" :class="{ 'is-checked': row.checked, 'is-indeterminate': isIndeterminate }">
    <span class="row-index">{{ seq }}</span>
    <el-checkbox v-model="row.checked" :indeterminate="isIndeterminate" class="row-checkbox" @change="handleCheckboxChange(row)"></el-checkbox>
    <div class="expand-icon" @click="handleExpandClick(row)">
      <Icon name="lucide:expand" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  seq: number
  row: any
  props: any
}>()
const { gridRef } = useMDTableInject()
const emit = defineEmits<{
  'expand-click': [row: any]
}>()
const handleExpandClick = (row: any) => {
  emit('expand-click', row)
}
const handleCheckboxChange = (rowData: any) => {
  const setChecked = (row: any, setCheckedStatus: boolean) => {
    if(row.children && row.children.length > 0) {
      row.children.forEach((child: any) => {
        setChecked(child, true)
      })
    }
    if(setCheckedStatus) {
      row.checked = rowData.checked
    }
  }
  gridRef.value?.toggleCheckboxRow(rowData)
  setChecked(rowData, false)
}
const isIndeterminate = computed(() => {
  if(!props.row.children || props.row.children.length === 0) return false
  const existUnChecked = props.row.children.some((child: any) => {
    return !child.checked
  })
  const existChecked = props.row.children.some((child: any) => child.checked)
  const existAllChecked = props.row.children.every((child: any) => child.checked)
  props.row.checked = existAllChecked
  return existUnChecked && existChecked
})
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
.expand-icon {
  position: absolute;
  left: 0px;
  top: 50%;
  height: 100%;
  transform: translate(0, -50%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.custom-checkbox-cell:hover .expand-icon,
.row--hover .expand-icon,
.custom-checkbox-cell:hover .row-checkbox,
.custom-checkbox-cell.is-checked .row-checkbox,
.row--hover .row-checkbox,
.row--checked .row-checkbox,
.is-indeterminate .row-checkbox
{
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}

.custom-checkbox-cell:hover .row-index,
.custom-checkbox-cell.is-checked .row-index,
.row--hover .row-index,
.row--checked .row-index,
.is-indeterminate .row-index {
  opacity: 0;
}
</style>
