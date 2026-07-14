<template>
  <el-dialog
  class="big"
    :model-value="modelValue"
    :title="title"
    width="90%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VxeGrid v-if="rows.length" v-bind="gridOptions" :data="rows" />
    <el-empty v-else description="沒有相關銷售訂單" />
  </el-dialog>
</template>

<script setup lang="ts">
import { soTableColumns } from '../../../composables/demo/soTableColumns'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    rows: any[]
    showAllocated?: boolean
  }>(),
  { showAllocated: false }
)

const emit = defineEmits(['update:modelValue'])

const gridOptions = computed(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 700,
  columns: soTableColumns({ allocated: props.showAllocated })
}))
</script>

<style scoped lang="scss">
:deep(.el-dialog__title) {
  font-size: 1.125rem;
}
:deep(.vxe-grid) {
  --vxe-ui-font-size-default: 0.875rem;
}
</style>
