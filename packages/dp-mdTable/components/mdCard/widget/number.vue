<script setup lang="ts">
import { formatNumber, getRowCellValue } from '../../../utils/fieldValueFormat'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const displayValue = computed(() => {
  const value = getRowCellValue(props.row, props.field)
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  const formatted = formatNumber(value, props.field?.display_structure || props.field?.properties || {})
  return formatted === '-' ? '--' : formatted
})
</script>

<template>
  <span class="field-value number-card-widget">{{ displayValue }}</span>
</template>
