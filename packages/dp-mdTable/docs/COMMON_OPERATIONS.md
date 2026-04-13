# Common Operations Reference

Quick reference for common tasks in the dp-mdTable package.

## Column Operations

### Get Column Context

```typescript
import { ColumnContextKey } from '@nicepkg/dp-mdTable/types/column-context'
import { inject } from 'vue'

const columnContext = inject(ColumnContextKey)
const {
  columns,           // Ref<ColumnConfig[]>
  addColumn,         // (column: ColumnConfig) => Promise<void>
  updateColumn,      // (field: string, updates: Partial<ColumnConfig>) => Promise<void>
  deleteColumn,      // (field: string) => Promise<void>
  getColumn,         // (field: string) => ColumnConfig | undefined
  addVirtualColumn,  // (relationField, displayField, position?) => Promise<void>
} = columnContext ?? {}
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

Virtual column settings are persisted to the parent relation's `displayStructure.virtualColumnSettings`:

```typescript
// Updates are persisted to the parent relation field
await updateColumn('rel_company.email', {
  properties: {
    aggregation: 'first',      // 'first' | 'last' | 'all' | 'count'
    showUniqueOnly: true,
    linkToRecord: false,
    separator: ', '
  }
})
```

**Note:** Virtual columns automatically inherit the target field's display settings (colors, formatting). The `aggregation`, `showUniqueOnly`, `separator`, and `linkToRecord` settings are virtual-column-specific and persisted.

### Delete Virtual Column

```typescript
// Removes from view.fields, does NOT delete the parent relation
await deleteColumn('rel_company.email')
```

## Relation Operations

### Update Relation Display Fields

When updating a relation's `displayFieldNames`, virtual columns are automatically synced:

```typescript
// Update relation to change display fields
await updateColumn('rel_company', {
  properties: {
    displayFieldNames: ['email', 'name', 'phone']  // Reordered: email is now first
  }
})
```

**Auto-sync behavior:**
- **Removed fields**: Virtual columns are removed from the view
- **Added fields**: Virtual columns are created (except for first field)
- **First field changes**: Old first field gets a virtual column, new first field's virtual column is removed
- **Settings cleanup**: `virtualColumnSettings` entries are cleaned up for completely removed fields

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
// Result: Creates relation column + auto-creates virtual column for 'email'
// First display field ('name') stays in the combined relation column
```

**Auto-create virtual columns**: When creating a relation with multiple display fields:
- First display field stays in the combined relation column
- Virtual columns are automatically created for all other display fields
- Virtual columns are positioned right after the relation column

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

### Get Card Config for a Table

```typescript
// Returns formStructure.card from target table (cached)
const cardConfig = await getTableCardConfig(targetTableId)
// Returns CardViewConfig or null if not configured
```

### Get Record by ID from Target Table

```typescript
// Fetch a single record by ID (uses cached table info)
const record = await getRecordById(targetTableId, recordId)
// Returns record data or null if not found
```

### Get Fields for Table (Cached)

```typescript
// Fields are cached after first fetch
const fields = await getFieldsForTable(targetTableId)
// Cache is reused for virtual columns and card preview
```

## Data Operations

### Get Data Context

```typescript
import { useTableDataInject } from './useTableData'

const {
  tableData,        // Ref<any[]>
  loading,          // Ref<boolean>
  refresh,          // () => Promise<void>
  addRow,           // (row: any) => Promise<void>
  updateRow,        // (id: string, updates: any) => Promise<void>
  deleteRow,        // (id: string) => Promise<void>
} = useTableDataInject()
```

### Add Row via Form Dialog

The table toolbar includes an "Add Row" button that opens a form dialog for creating new records:

```typescript
// In TableDetailView.vue
function handleAddRow() {
  addRowDialogRef.value?.open()
}

async function handleAddRowSubmit(data: Record<string, any>) {
  try {
    await tableView.addRow(data)
    ElMessage.success('Row added successfully')
    // Table data is automatically refreshed
  } catch (error) {
    console.error('Error adding row:', error)
    ElMessage.error('Failed to add row')
  }
}
```

The form dialog uses the table's form configuration (`formStructure.form`) to render fields. If no form is configured, a default form is generated from the table fields (excluding system fields like `id`, `created_at`, `updated_at`, etc.).

### Refresh Table Data

```typescript
await refresh()
// Or via grid ref
await gridRef.value?.commitProxy('reload')
```

## View Operations

### Get View Context

```typescript
import { useViewInject } from './useTableViews'

const {
  currentView,      // Ref<CaseViewRecord>
  views,            // Ref<CaseViewRecord[]>
  updateView,       // (viewId, updates) => Promise<void>
  switchView,       // (viewId) => Promise<void>
} = useViewInject()
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

## Record Card Preview

### How Card Preview Works

When a user clicks on a relation tag in a cell, a card preview dialog appears:

```typescript
// 1. RelationView (view.ts) dispatches event on tag click
$grid.dispatchEvent('relation-cell-click', {
  event: e,
  targetElement: e.currentTarget,
  targetTableId: relationOptions?.relationTableId,
  recordId: relationUuids[index],
  displayValue: val,
  row
})

// 2. mdTable/index.vue handles the event
'relation-cell-click': (params: any) => {
  const { targetElement, targetTableId, recordId } = params
  recordCardDialogRef.value.open(targetElement, { targetTableId, recordId })
}

// 3. RecordCardDialog fetches data via ColumnContext
const [config, fields, record] = await Promise.all([
  columnContext.getTableCardConfig(params.targetTableId),
  columnContext.getFieldsForTable(params.targetTableId),  // Cached
  columnContext.getRecordById(params.targetTableId, params.recordId)
])

// 4. CardPreview renders the card with data
```

### Card Configuration

Card config is stored in `case_tables.formStructure.card`:

```typescript
interface CardViewConfig {
  fields: ViewFieldConfig[]     // Fields to display
  titleField?: string           // Field for card title
  subtitleField?: string        // Field for subtitle
  coverField?: string           // Attachment field for cover image
  advanced?: AdvancedConfig     // Custom CSS/JS/template
}
```

### Default Card Config

If no card config exists, a default is generated:
- Title field: First text field
- Display fields: First 5 non-system fields

## Form Configuration

### Form View Config

Form configuration is stored in `case_tables.formStructure.form`:

```typescript
interface FormViewConfig {
  fields: ViewFieldConfig[]      // Fields to display in the form
  layout?: 'single' | 'multi'    // Form layout mode
  labelPosition?: 'top' | 'left' // Label position
  labelWidth?: number            // Label width in pixels (when position is 'left')
  advanced?: AdvancedConfig      // Custom CSS/JS/template
}
```

### ViewFieldConfig

```typescript
interface ViewFieldConfig {
  fieldName: string              // Field name from the table
  colSpan?: number               // Grid column span (1-12, default: 12)
  label?: string                 // Custom label (optional)
  hidden?: boolean               // Hide this field
  required?: boolean             // Make field required
  advanced?: AdvancedConfig      // Field-level customization
}
```

### Form Renderer Component

The `FormRenderer` component renders a form based on the configuration:

```vue
<template>
  <FormRenderer
    ref="formRendererRef"
    :config="formConfig"
    :fields="fieldInfoList"
    :model-value="formData"
    @submit="handleSubmit"
  />
</template>

<script setup>
const formRendererRef = ref()

// Validate and submit form
async function submitForm() {
  const isValid = await formRendererRef.value?.submitForm()
  if (isValid) {
    const formData = formRendererRef.value?.formData
    // Process formData...
  }
}

// Reset form
function resetForm() {
  formRendererRef.value?.resetForm()
}
</script>
```

### Default Form Config

If no form config exists, a default is generated:
- Excludes system fields: `id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `col_id`
- Excludes read-only fields: Formula, Aggregation/VirtualColumn
- Excludes complex fields: Attachment, Relation
- All fields are full width (`colSpan: 12`)
- Checkbox fields are not required by default

### Supported Form Field Types

The form renderer supports these field types:

| Type | Component | Validation |
|------|-----------|------------|
| Text (19) | el-input | string |
| MultiText (1) | el-input (textarea) | string |
| Number (2) | el-input-number | number |
| SingleSelect (3) | el-select | string |
| MultiSelect (4) | el-select (multiple) | array |
| DateTime (5) | el-date-picker | date |
| Checkbox (11) | el-checkbox | boolean |
| Rating (12) | el-rate | number |
| Email (9) | el-input (type=email) | email |
| URL (8) | el-input (type=url) | url |
| Phone (10) | el-input | string |
| Currency (17) | el-input-number | number |
| Percent (18) | el-input-number | number |

## Error Handling

### Common Errors

1. **"ColumnContext not found"**
   - Ensure `ColumnContextKey` is provided by parent composable
   - Check that column context is provided (parent provides `ColumnContextKey`) and component uses `inject(ColumnContextKey)`

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
