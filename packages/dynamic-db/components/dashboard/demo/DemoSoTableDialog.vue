<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="80%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VxeGrid v-if="rows.length" v-bind="gridOptions" :data="rows" />
    <el-empty v-else description="No related sales orders" />
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
  maxHeight: 500,
  columns: soTableColumns({ allocated: props.showAllocated })
}))
</script>
