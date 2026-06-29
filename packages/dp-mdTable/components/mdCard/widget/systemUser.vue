<script setup lang="ts">
import { getRowCellValue } from '../../../utils/fieldValueFormat'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const displayValue = computed(() => getRowCellValue(props.row, props.field) || '--')
</script>

<template>
  <span class="field-value">{{ displayValue }}</span>
</template>
