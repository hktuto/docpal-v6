<script setup lang="ts">
import { ColumnFieldType } from '../../../types/column-types'
import { getRowCellValue } from '../../../utils/fieldValueFormat'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const cellValue = computed(() => getRowCellValue(props.row, props.field))
const selectOptions = computed(() => props.field?.display_structure?.options ?? props.field?.properties?.options ?? [])
const isMultiSelect = computed(() => props.field?.business_type?.toString() === ColumnFieldType.MultiSelect)

function findOption(id: unknown) {
  return selectOptions.value.find(
    (option: any) => option.id === id || option.value === id || option.label === id
  )
}

const selectedOptions = computed(() => {
  const value = cellValue.value
  if (value === null || value === undefined || value === '' || !selectOptions.value.length) {
    return []
  }

  if (isMultiSelect.value) {
    if (!Array.isArray(value)) return []
    return value.map((id: string) => findOption(id)).filter(Boolean)
  }

  const option = findOption(value)
  return option ? [option] : []
})
</script>

<template>
  <span v-if="!selectedOptions.length" class="field-value" @click.stop>--</span>
  <div v-else-if="isMultiSelect" class="table-tag-list select-card-widget field-value" @click.stop>
    <div
      v-for="(option, index) in selectedOptions"
      :key="option.id || index"
      class="table-tag"
      :style="{ '--color': option.color }"
      :title="option.label"
    >
      {{ option.label }}
    </div>
  </div>
  <div
    v-else
    class="table-tag select-card-widget field-value"
    :style="{ '--color': selectedOptions[0].color }"
    :title="selectedOptions[0].label"
    @click.stop
  >
    {{ selectedOptions[0].label }}
  </div>
</template>

<style scoped lang="scss">
.select-card-widget {
  min-width: 0;
}

.select-card-widget.table-tag,
.select-card-widget :deep(.table-tag) {
  padding: 1px 4px;
  font-size: var(--app-font-size-s);
  line-height: 1.3;
}

.select-card-widget.table-tag-list {
  gap: 2px;
}
</style>
