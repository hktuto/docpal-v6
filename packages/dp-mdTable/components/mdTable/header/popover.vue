<template>
  <UiPopoverDialog ref="popoverRef" :width="200">
    <div v-for="item in filteredList" :key="item.label" :class="`mdTableHeader-item mdTableHeader-${item.type}`" @click="handleClick(item.type)">
      <Icon :name="item.icon" />
      <span>{{ item.label }}</span>
    </div>
  </UiPopoverDialog>
</template>
<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const emits = defineEmits(['headerClick'])
let triggerEl: HTMLElement | null = null
let currentColumn: any = null
const { gridRef, addColumn, deleteColumn, columns, addColumnPopoverRef } = useMDTableInject()
const baseList = [
  { label: 'Column Setting', icon: 'lucide:square-pen', type: 'edit' },
  { label: 'Insert Column ', icon: 'lucide:panel-left-close', type: 'insertLeft' },
  { label: 'Delete Column', icon: 'lucide:trash-2', type: 'delete' }
]

// Relation-specific menu items
const relationMenuItems = [{ label: 'Add Virtual Column', icon: 'lucide:columns-3', type: 'addVirtualColumn' }]

// Filter menu items based on column type
const filteredList = computed(() => {
  if (!currentColumn) return baseList

  const columnType = currentColumn.type

  // Check if it's a relation column (type 14 = MagicLink)
  const isRelationColumn = columnType === 14 || columnType === 'MagicLink' || currentColumn.properties?.relationTableId

  // Check if it's a virtual column (type 15 = VirtualColumn or has dot notation)
  const isVirtualColumn = columnType === 15 || columnType === 'VirtualColumn' || currentColumn.field?.includes('.')

  let items = [...baseList]

  // Add relation-specific items for relation columns (but not virtual columns)
  if (isRelationColumn && !isVirtualColumn) {
    // Insert after 'Column Setting'
    items.splice(1, 0, ...relationMenuItems)
  }

  return items
})

const popoverRef = ref()

function open(_triggerEl: HTMLElement | null, _column: any) {
  triggerEl = _triggerEl
  currentColumn = _column
  popoverRef.value.open(triggerEl)
}

const handleClick = (type: string) => {
  popoverRef.value.close()
  const fullColumn = columns.value.find((item: any) => item.field_name === currentColumn.field)
  switch (type) {
    case 'edit':
      addColumnPopoverRef.value.show(triggerEl, currentColumn)
      break
    case 'sortAz':
      gridRef.value.sort(currentColumn.field, 'asc')
      break
    case 'sortZa':
      gridRef.value.sort(currentColumn.field, 'desc')
      break
    case 'insertLeft':
      const defaultNewColumn = {
        field_name: `New Column`,
        business_type: ColumnFieldType.MultiText
      } as unknown as ColumnConfig
      addColumn([defaultNewColumn], fullColumn.id, 'left')
      break
    case 'insertRight':
      const defaultNewColumnRight = {
        field_name: `New Column`,
        business_type: ColumnFieldType.MultiText
      } as unknown as ColumnConfig
      addColumn([defaultNewColumnRight], fullColumn.id, 'right')
      break
    case 'addVirtualColumn':
      // virtualColumnDialogRef.value?.open(triggerEl, column)
      break
    case 'editDescription':
      break
    case 'permission':
      break
    case 'hide':
      break
    case 'delete':
      if (!fullColumn?.id) break
      try {
        deleteColumn(fullColumn.id as string)
      } catch (error) {
        console.error(error)
      }
      break
  }
}
defineExpose({
  open
})
</script>

<style scoped lang="scss">
.mdTableHeader-item {
  display: flex;
  gap: var(--app-space-xs);
  justify-content: start;
  cursor: pointer;
  padding: var(--app-space-xs);
  &:hover {
    background: var(--app-primary-alpha-10);
    color: var(--app-primary);
  }
}
</style>
