<script lang="ts" setup>
import type { CaseTypeRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  items: CaseTypeRecord[]
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}>()

const { highlightText } = useTextHighlight()
const emits = defineEmits(['selected', 'delete'])
const tableRef = ref<HTMLElement>()

function compareValues(aVal: any, bVal: any) {
  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
  }
  if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal
  const aTime = Date.parse(aVal)
  const bTime = Date.parse(bVal)
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime
  return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
}

const sortedRows = computed(() => {
  const rows = [...(props.items || [])]
  const field = typeof props.sortBy === 'string' ? props.sortBy : (props.sortBy as any)?.value
  if (!field) return rows
  const order = typeof props.sortOrder === 'string' ? props.sortOrder : (props.sortOrder as any)?.value
  const dir = order === 'desc' ? -1 : 1
  rows.sort((a: any, b: any) => compareValues(a[field], b[field]) * dir)
  return rows
})

function handleRowClick(row: CaseTypeRecord) {
  emits('selected', row)
}

function scrollToTop() {
  tableRef.value?.scrollTo({ top: 0 })
}

defineExpose({
  scrollToTop
})
</script>
<template>
  <div ref="tableRef" class="database-list-table">
    <table>
      <thead>
        <tr>
          <th class="col-icon"></th>
          <th>Name</th>
          <th>Description</th>
          <th>Created Date</th>
          <th>Updated Date</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in sortedRows"
          :key="row.id"
          :class="{ 'dimmed-row': row.__dim }"
          tabindex="0"
          @click="handleRowClick(row)"
          @dblclick="handleRowClick(row)"
          @keydown.enter="handleRowClick(row)"
        >
          <td class="col-icon">
            <Icon v-if="row.icon || row.metadata?.icon" :name="row.icon || row.metadata?.icon" />
          </td>
          <td v-html="highlightText(row.name, keyword || '')"></td>
          <td v-html="highlightText(row.description || '', keyword || '')"></td>
          <td>{{ formatDate(row.created_at || row.createdAt) }}</td>
          <td>{{ formatDate(row.updated_at || row.updatedAt) }}</td>
          <td class="col-actions" @click.stop>
            <Icon name="lucide:eye" class="action-icon" @click="emits('selected', row)" />
            <Icon name="lucide:trash-2" class="action-icon action-icon--danger" @click="emits('delete', row)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.database-list-table {
  height: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--app-space-xs) var(--app-space-s);
  text-align: left;
  border-bottom: 1px solid var(--app-grey-800);
  font-size: var(--app-font-size-s);
}

th {
  position: sticky;
  top: 0;
  background: var(--app-paper);
  color: var(--app-text-color-secondary);
  font-weight: 600;
  z-index: 1;
}

tbody tr {
  cursor: pointer;

  &:hover {
    background: var(--app-grey-950);
  }
}

.col-icon {
  width: 48px;
}

.col-actions {
  width: 80px;
  white-space: nowrap;
}

.dimmed-row {
  opacity: 0.5;
}

:deep(mark.highlight) {
  background-color: yellow;
  color: var(--app-primary);
  font-weight: 600;
  border-radius: var(--app-border-radius-xs);
  padding: 0 2px;
}

.action-icon {
  margin-right: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);

  &:hover {
    color: var(--app-primary-color);
  }

  &--danger:hover {
    color: var(--app-error-color);
  }
}
</style>
