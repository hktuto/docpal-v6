<script setup lang="ts">
import { useMDKanbanInject } from '../../composables/mdKanban/useMDKanban'
import { ColumnFieldType } from '../../types/column-types'

const props = defineProps<{
  item: any
  field: any
  theme: any
}>()

const { viewStyleConfig, columns } = useMDKanbanInject()

const layout = computed(() => viewStyleConfig.value?.layout)

function formatFieldValue(fieldName: string, rawValue: any): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') return ''

  const col = columns.value?.find((c: any) => c.field_name === fieldName)
  if (!col) return String(rawValue)

  const businessType = col.business_type?.toString()

  // Single Select
  if (businessType === ColumnFieldType.SingleSelect) {
    const options = col.display_structure?.options || []
    const option = options.find((opt: any) => opt.id === rawValue)
    return option?.label ?? String(rawValue)
  }

  // Multi Select
  if (businessType === ColumnFieldType.MultiSelect) {
    const ids = Array.isArray(rawValue) ? rawValue : [rawValue]
    const options = col.display_structure?.options || []
    const labels = ids
      .map((id: string) => options.find((opt: any) => opt.id === id)?.label)
      .filter(Boolean)
    return labels.join(', ')
  }

  return String(rawValue)
}

const titleValue = computed(() => {
  if (!layout.value?.title) return ''
  return formatFieldValue(layout.value.title, props.item[layout.value.title])
})

const contentValues = computed(() => {
  if (!layout.value?.content?.length) return []
  return layout.value.content.map((fieldName: string) => ({
    field: fieldName,
    value: formatFieldValue(fieldName, props.item[fieldName])
  }))
})
</script>

<template>
  <div class="groupItem">
    <div v-if="layout?.title" class="card-title">{{ titleValue }}</div>
    <div v-if="contentValues.length" class="card-content">
      <div v-for="c in contentValues" :key="c.field" class="card-field">
        <span class="field-value">{{ c.value }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.groupItem {
  flex: 0 0 auto;
  width: 100%;
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-s);
  background-color: var(--app-color-bg);
  overflow: hidden;
  border: 1px solid var(--app-grey-800);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.card-title {
  font-weight: bold;
  font-size: var(--app-font-size-m);
  word-break: break-word;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-field {
  font-size: var(--app-font-size-s);
  color: var(--app-grey-300);
  word-break: break-word;
}
</style>
