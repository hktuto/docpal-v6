# Common Operations Reference

Quick reference for common tasks in the dp-mdTable package.

## Column Operations

### Get Column Context

```typescript
import { useColumnsContext } from '@nicepkg/dp-mdTable/composables/useColumns'

const {
  columns,           // Ref<ColumnConfig[]>
  addColumn,         // (column: ColumnConfig) => Promise<void>
  updateColumn,      // (field: string, updates: Partial<ColumnConfig>) => Promise<void>
  deleteColumn,      // (field: string) => Promise<void>
  getColumn,         // (field: string) => ColumnConfig | undefined
  addVirtualColumn,  // (relationField, displayField, position?) => Promise<void>
} = useColumnsContext()
```

### Add a New Column

```typescript
await addColumn({
  field: 'new_field',
  title: 'New Field',
  type: ColumnFieldType.Text,
  properties: {}
})
```

### Update Column Settings

```typescript
await updateColumn('field_name', {
  title: 'Updated Title',
  properties: {
    ...existingProperties,
    newSetting: 'value'
  }
})
```

### Add Virtual Column from Relation

```typescript
// Adds a column showing 'email' from the 'rel_company' relation
await addVirtualColumn('rel_company', 'email', {
  targetColumn: 'rel_company',  // Position next to
  side: 'right'
})
```

### Update Virtual Column Settings

Virtual columns are view-level only - updates don't affect the parent relation:

```typescript
// This only updates the local column config, not the database
await updateColumn('rel_company.email', {
  properties: {
    displayMode: 'chips',      // 'text' | 'chips' | 'list' | 'link'
    aggregation: 'first',      // 'first' | 'last' | 'all' | 'count'
    showUniqueOnly: true,
    linkToRecord: false,
    separator: ', '
  }
})
```

### Delete Virtual Column

```typescript
// Removes from view.fields, does NOT delete the parent relation
await deleteColumn('rel_company.email')
```

## Relation Operations

### Create Relation from Column

```typescript
// In useTableView context
await createRelationFromColumn(
  'company_id',           // Source field to match
  targetTableId,          // UUID of target table
  targetFieldId,          // Field in target to match
  ['name', 'email'],      // Display field names (array)
  'Company'               // Relation column name
)
```

### Get Existing Relation to Table

```typescript
const existingRelation = await getExistingRelationToTable(targetTableId)
if (existingRelation) {
  // Relation already exists, can add display fields to it
  console.log(existingRelation.displayFieldNames)
}
```

### Get All Relation Fields

```typescript
const relationFields = getRelationFields()
// Returns array of fields where businessType === 'relation'
```

## Data Operations

### Get Data Context

```typescript
import { useTableDataContext } from './useTableData'

const {
  tableData,        // Ref<any[]>
  loading,          // Ref<boolean>
  refresh,          // () => Promise<void>
  addRow,           // (row: any) => Promise<void>
  updateRow,        // (id: string, updates: any) => Promise<void>
  deleteRow,        // (id: string) => Promise<void>
} = useTableDataContext()
```

### Refresh Table Data

```typescript
await refresh()
// Or via grid ref
await gridRef.value?.commitProxy('reload')
```

## View Operations

### Get View Context

```typescript
import { useViewContext } from './useTableViews'

const {
  currentView,      // Ref<CaseViewRecord>
  views,            // Ref<CaseViewRecord[]>
  updateView,       // (viewId, updates) => Promise<void>
  switchView,       // (viewId) => Promise<void>
} = useViewContext()
```

### Update View Fields Order

```typescript
await updateView(currentView.value.id, {
  fields: ['field1', 'field2', 'rel_company.email', 'field3']
})
```

## Renderer Registration

### Register Custom Renderer

```typescript
// In render-components.ts
import { MyTypeView, MyTypeEdit } from './components/MyType/view'

export const MDTableComponents = {
  // ... existing
  MyType: {
    name: 'MyType',
    titleConfig: {
      icon: 'lucide:star',
      content: 'My Type'
    },
    view: {
      name: 'MyTypeView',
      render: MyTypeView,
      defaultOptions: {
        // default settings
      }
    },
    edit: {
      name: 'MyTypeEdit', 
      render: MyTypeEdit,
      defaultOptions: {}
    }
  }
}
```

### Create View Renderer

```typescript
// In renderers/components/MyType/view.ts
import { h } from 'vue'
import type { ViewRenderFunctionParams } from '../../../types/column-types'

export const MyTypeView = ({ options, params }: ViewRenderFunctionParams) => {
  const { row, column } = params
  const value = row[column.field]
  const cellProps = options.props || {}
  
  // Access column properties
  const myOption = cellProps.myOption || 'default'
  
  return h('div', { 
    class: 'my-type-cell'
  }, [
    // render content
    String(value || '')
  ])
}
```

## Column Settings Component

### Create Settings Component

```vue
<!-- In components/mdTable/addColumn/field/MyType.vue -->
<template>
  <div class="my-type-settings">
    <el-form-item label="My Setting">
      <el-input v-model="localValue" @input="handleChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: {
    mySetting?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:formData', value: any): void
}>()

const localValue = ref(props.formData.mySetting || '')

function handleChange(value: string) {
  emit('update:formData', {
    ...props.formData,
    mySetting: value
  })
}
</script>
```

### Register in columnBasic.ts

```typescript
// In components/mdTable/addColumn/columnBasic.ts
export const columnBasic = {
  // ... existing
  [ColumnFieldType.MyType]: {
    label: 'My Type',
    isBasic: true,           // Show in "Basic" section
    component: 'MyType',     // Component name in field/ folder
    order: 10                // Display order
  }
}
```

## Header Menu Customization

### Add Menu Item to Header Popover

```typescript
// In components/mdTable/header/popover.vue
const relationMenuItems = [
  {
    label: 'Add Virtual Column',
    icon: 'lucide:columns-3',
    emit: 'addVirtualColumn'
  },
  // Add custom item
  {
    label: 'My Custom Action',
    icon: 'lucide:star',
    emit: 'myCustomAction'
  }
]

// In filteredList computed, add condition:
if (currentColumn.type === ColumnFieldType.MyType) {
  result.push(...myTypeMenuItems)
}
```

## Relation Suggestions

### Get Suggestion Context (Consumer Level)

```typescript
// In TableDetailView.vue - provides to headers
const { getPendingSuggestions, acceptSuggestion, dismissSuggestion } = useRelationSuggestions()

// Track suggestions by field
const suggestionsByField = ref<Map<string, { count: number; fieldId: string }>>(new Map())

// Provide to headers
provide('columnSuggestions', {
  getSuggestionCount: (fieldName: string) => suggestionsByField.value.get(fieldName)?.count || 0,
  getFieldId: (fieldName: string) => suggestionsByField.value.get(fieldName)?.fieldId || null,
  openSuggestionPopover: (fieldName, fieldId, target) => {
    columnSuggestionPopoverRef.value?.open(fieldId, fieldName, tableId, target)
  }
})
```

### Analyze Table for Suggestions

```typescript
const { analyzeTableForRelations } = useRelationSuggestions()

// Returns number of suggestions created
const count = await analyzeTableForRelations(tableId, entityId)
```

### Accept a Suggestion

```typescript
// 1. Create the relation
await createRelationFromColumn(
  sourceFieldName,
  suggestion.targetTableId,
  suggestion.targetFieldId,
  displayFieldNames,  // Array of field names
  relationColumnName
)

// 2. Mark suggestion as accepted
await acceptSuggestion(suggestion.id)

// 3. Dismiss other suggestions for same target table
await dismissSuggestionsByTargetTable(tableId, suggestion.targetTableId)
```

### Dismiss a Suggestion

```typescript
await dismissSuggestion(suggestionId)
// Or dismiss all for a table
await dismissAllSuggestions(tableId)
```

### Handle Suggestion Badge Click (Header Component)

```typescript
// In header/index.vue
const columnSuggestions = inject('columnSuggestions')

const suggestionCount = computed(() => {
  if (!columnSuggestions || !props.column?.field) return 0
  if (props.column.field.includes('.')) return 0  // Skip virtual columns
  if (props.column.type === 14) return 0  // Skip relation columns
  return columnSuggestions.getSuggestionCount(props.column.field)
})

function handleSuggestionClick() {
  const fieldId = columnSuggestions.getFieldId(props.column.field)
  columnSuggestions.openSuggestionPopover(props.column.field, fieldId, badgeElement)
}
```

## Import Operations

### Initialize Import Composable

```typescript
import { useImportToTable } from './useImportToTable'

const importComposable = useImportToTable({
  physicalTableName: tableView.physicalTableName,
  fields: tableView.fields,
  query
})
```

### Parse Excel File

```typescript
// Get sheet information (name, row count, columns, preview)
const sheets = await importComposable.parseExcelSheets(file)

// Parse specific sheet data
const { columns, rows } = await importComposable.parseSheetData(file, sheetIndex)
```

### Auto-Suggest Column Mappings

```typescript
// Get fields that can be import targets (excludes relation, virtual, formula)
const eligibleFields = importComposable.getEligibleFields()

// Get auto-suggested mappings
const mappings = importComposable.suggestMappings(excelColumns)
// Returns: [{ excelColumn: 'Email', fieldName: 'email', autoSuggested: true }, ...]
```

### Run Import with Upsert

```typescript
const result = await importComposable.importData(rows, {
  sheetIndex: 0,
  columnMappings: mappings,
  lookupColumns: ['email', 'order_id'],  // Match existing records by these fields
  updateStrategy: 'all'  // 'all' or 'non_empty'
})

// Result: { inserted: 50, updated: 10, skipped: 2, errors: [], relationErrors: [] }
```

### Upsert Rows Directly

```typescript
// Via useTableDataProvider
const result = await upsertRows(
  rowsData,
  ['email'],           // Lookup columns
  'non_empty'          // Update strategy
)
// Result: { inserted: 10, updated: 5, errors: [] }
```

### Handle Import in TableDetailView

```typescript
function handleImport() {
  importDialogRef.value?.open({
    physicalTableName: tableView.physicalTableName,
    fields: tableView.fields,
    query,
    tableDisplayName: 'My Table',
    tableIdValue: tableId
  })
}

async function handleImportComplete(result) {
  if (result.inserted > 0 || result.updated > 0) {
    await tableView.refresh()
  }
}
```

## Error Handling

### Common Errors

1. **"ColumnContext not found"**
   - Ensure `ColumnContextKey` is provided by parent composable
   - Check that `useColumnsContext()` is called within component tree

2. **"Display field not found"**
   - Verify `displayFieldNames` contains valid field names
   - Check target table has the field

3. **"Renderer not registered"**
   - Add renderer to `MDTableComponents` in `render-components.ts`
   - Call `registryManager.registerAllRenderers()` on app init

4. **"DataCloneError: Failed to execute 'postMessage' on 'Worker'"**
   - Vue reactive arrays (Proxy objects) can't be cloned for Worker postMessage
   - Convert to plain arrays using spread: `[...reactiveArray]`
   - Or use `ensurePlainArray()` helper before passing to pglite queries

5. **"Virtual column update affecting parent relation"**
   - Ensure `updateColumn` checks for dot notation and handles virtual columns separately
   - Virtual columns should only update local config, not database

## Testing

### Mock Column for Testing

```typescript
const mockColumn: ColumnConfig = {
  field: 'test_field',
  title: 'Test Field',
  type: ColumnFieldType.Text,
  properties: {}
}
```

### Mock Row Data

```typescript
const mockRow = {
  id: 'uuid',
  test_field: 'value',
  rel_company: ['uuid1', 'uuid2'],  // Relation stores UUIDs
  'rel_company.email': 'test@example.com'  // Virtual column data
}
```
