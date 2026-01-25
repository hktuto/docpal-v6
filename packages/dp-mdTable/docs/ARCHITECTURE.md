# dp-mdTable Package Architecture

This document provides a comprehensive overview of the `dp-mdTable` package for AI/LLM assistants to understand and work with the codebase effectively.

## Overview

`dp-mdTable` is a dynamic, extensible table component built on top of [vxe-table](https://vxetable.cn/). It provides:

- Dynamic column rendering based on field types
- Relation/Magic Link columns with virtual column support
- Filtering, sorting, grouping capabilities
- Cell-level editing with custom renderers
- Formula columns with expression evaluation

## Package Structure

```
packages/dp-mdTable/
├── components/           # Vue components
│   ├── mdTable/          # Core table components
│   │   ├── index.vue     # Main table component
│   │   ├── Toolbar.vue   # Table toolbar
│   │   ├── header/       # Column header components
│   │   └── addColumn/    # Add/edit column UI
│   └── tools/            # Utility components (filter, sort, grouping)
├── composables/          # Vue composables (core logic)
├── renderers/            # Cell renderer system
├── types/                # TypeScript type definitions
├── utils/                # Helper utilities
└── docs/                 # Documentation
```

## Core Concepts

### 1. Column Field Types

Defined in `types/column-types.ts`:

```typescript
enum ColumnFieldType {
  Text = 19,           // Single-line text
  MultiText = 1,       // Multi-line text
  Number = 2,          // Numeric values
  SingleSelect = 3,    // Single selection dropdown
  MultiSelect = 4,     // Multi-selection dropdown
  DateTime = 5,        // Date/time picker
  Email = 9,           // Email with mailto link
  URL = 8,             // Clickable URL
  Phone = 10,          // Phone number
  Checkbox = 11,       // Boolean checkbox
  Rating = 12,         // Star rating
  Member = 13,         // User/member reference
  MagicLink = 14,      // Relation to another table
  VirtualColumn = 15,  // Derived column from relation
  Formula = 16,        // Computed formula column
  // ... more types
}
```

### 2. ColumnConfig Interface

The core column configuration object:

```typescript
interface ColumnConfig {
  field: string               // Unique field identifier
  title: string               // Display title
  type: ColumnFieldType       // Field type enum
  width?: number | string     // Column width
  properties?: {              // Type-specific settings
    // For Select types:
    options?: SelectOption[]
    // For DateTime:
    dateFormat?: string
    // For Relation (MagicLink):
    relationTableId?: string
    displayFieldNames?: string[]
    // For VirtualColumn:
    sourceRelationField?: string
    displayFieldName?: string
    // ... more per type
  }
}
```

### 3. Relation Columns (MagicLink) vs Virtual Columns

**MagicLink (type 14)**: A relation field that links to another table.
- Stores array of UUIDs referencing related records
- Has `displayFieldNames` - list of fields to fetch from target table
- Renders all display fields combined in one cell

**VirtualColumn (type 15)**: A derived column showing ONE field from a relation.
- Created from an existing MagicLink column
- Shows a single `displayFieldName` as a separate column
- Useful when you need relation data in its own sortable/filterable column

Example flow:
1. Create relation `rel_company` (MagicLink) → shows "Company Name, Email" combined
2. Add virtual column `rel_company.email` → shows only "Email" in separate column

## Composables Architecture

### Provider/Consumer Pattern

The package uses Vue's `provide/inject` for dependency injection:

```
┌─────────────────────────────────────────────────────────┐
│  Consumer Application (e.g., demo/workspaces)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  useTableView() - Main Orchestrator               │  │
│  │  ├── useTableFields()   → FieldContextKey         │  │
│  │  ├── useTableViews()    → ViewContextKey          │  │
│  │  ├── useTableColumns()  → ColumnContextKey        │  │
│  │  └── useTableDataProvider() → TableDataContextKey │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↓ provides                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  dp-mdTable package                               │  │
│  │  ├── useMDTable() - Consumes contexts             │  │
│  │  ├── useColumnsContext() - Column operations      │  │
│  │  └── useTableDataContext() - Data operations      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Composables

#### `useMDTable.ts` (Package Level)
Main table composable that:
- Consumes column and data contexts
- Provides `MdTableContextKey` to child components
- Configures grid options via `useTableConfig`
- Exposes table operations (add/update/delete columns/rows)

#### `useColumns.ts` (Package Level)
Defines `ColumnContext` interface and provides column operations:
- `getColumn(field)` - Get column by field name
- `addColumn(column)` - Add new column
- `updateColumn(field, updates)` - Update column settings
- `deleteColumn(field)` - Remove column
- `addVirtualColumn(relationField, displayField)` - Create virtual column

#### Consumer Composables (in demo/workspaces)

These implement the actual data layer and provide contexts:

- **useTableFields**: Manages `CaseFieldRecord` (database schema)
- **useTableViews**: Manages `CaseViewRecord` (display configurations)
- **useTableColumns**: Maps fields → ColumnConfig, handles virtual columns
- **useTableDataProvider**: CRUD operations, relation data fetching

## Renderer System

### How Renderers Work

1. **Registration** (`registry-manager.ts`):
   - `RendererRegistryManager` registers all cell renderers with vxe-table
   - Each renderer has `view` (display) and `edit` (input) modes

2. **Component Mapping** (`render-components.ts`):
   - Maps `ColumnFieldType` → renderer configuration
   - Each type has: `view.render()`, `edit.render()`, `defaultOptions`

3. **Column Configuration** (`getColumnConfig()`):
   - Converts `ColumnFieldType` to vxe-table column config
   - Sets `cellRender` for view mode, `editRender` for edit mode

### Creating a New Renderer

```typescript
// In renderers/components/MyType/view.ts
export const MyTypeView = ({ options, params }: ViewRenderFunctionParams) => {
  const { row, column } = params
  const value = row[column.field]
  return h('div', { class: 'my-type-cell' }, value)
}

export const MyTypeEdit = ({ options, params }: EditRenderFunctionParams) => {
  // Return input component
}

// In renderers/render-components.ts
export const MDTableComponents = {
  MyType: {
    name: 'MyType',
    titleConfig: { icon: 'lucide:my-icon', content: 'My Type' },
    view: { render: MyTypeView, defaultOptions: {} },
    edit: { render: MyTypeEdit, defaultOptions: {} }
  }
}
```

## Component Hierarchy

```
<MDTable>                           # Main table component
├── <Toolbar>                       # Top toolbar (optional)
├── <vxe-grid>                      # vxe-table grid
│   ├── Header Slot                 # Column headers
│   │   └── <header/index.vue>      # Custom header with popover + suggestion badge
│   │       └── <header/popover.vue> # Column context menu
│   ├── Cell Slots                  # Cell content
│   │   └── Renderer (view/edit)    # Type-specific renderer
│   └── Footer Slot                 # Aggregation row
├── <addColumn/popover.vue>         # Add column dialog
│   └── <field/*.vue>               # Type-specific settings
├── <VirtualColumnDialog>           # Add virtual column picker
└── <tools/*>                       # Filter/Sort/Group popovers

Consumer Components (demo/workspaces):
├── <TableDetailView>               # Main table view container
│   ├── <ColumnSuggestionPopover>   # Per-column suggestion popover
│   ├── <RelationSuggestionsDialog> # Full suggestions dialog
│   └── <CreateRelationDialog>      # Manual relation creation
```

## Database Schema (for demo/workspaces)

### CaseFieldRecord (case_fields table)
```typescript
interface CaseFieldRecord {
  id: string
  tableId: string
  fieldName: string           // Unique per table (e.g., "company_name")
  fieldNameAlias: string      // Display name (e.g., "Company Name")
  businessType: string        // 'text', 'number', 'relation', etc.
  fieldType: string           // PostgreSQL type
  displayStructure: JSON      // { type: ColumnFieldType, properties: {...} }
  
  // Relation-specific fields:
  relationTableId?: string    // Target table ID
  displayFieldNames?: string[] // Fields to fetch from target table
  lookupFieldId?: string      // Field to match on
}
```

### CaseViewRecord (case_views table)
```typescript
interface CaseViewRecord {
  id: string
  tableId: string
  name: string
  fields: string[]            // Ordered list of visible field names
  filters?: JSON              // Filter configuration
  sorts?: JSON                // Sort configuration
  groups?: JSON               // Grouping configuration
}
```

## Relation Suggestions System

The table supports automatic relation suggestions that analyze data and suggest potential relations between tables.

### How It Works

1. **Analysis Phase**: When a table is created/imported, `useRelationSuggestions.analyzeTableForRelations()` scans field values
2. **Matching**: Compares values against other tables in the same entity to find matches (>50% match rate)
3. **Storage**: Suggestions stored in `relation_suggestions` table with status: `pending`, `accepted`, `dismissed`
4. **Display**: Column headers show suggestion badges; clicking opens a popover to accept/dismiss

### Column Suggestion Badges

Headers inject `columnSuggestions` context from the consumer:

```typescript
// Provided by TableDetailView
provide('columnSuggestions', {
  getSuggestionCount: (fieldName: string) => number,
  getFieldId: (fieldName: string) => string | null,
  openSuggestionPopover: (fieldName, fieldId, target) => void
})

// Consumed by header/index.vue
const columnSuggestions = inject('columnSuggestions')
const suggestionCount = computed(() => 
  columnSuggestions?.getSuggestionCount(column.field) || 0
)
```

### Suggestion Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Column Header   │────▶│ ColumnSuggestion │────▶│ Create Relation │
│ Badge (✨ 2)    │     │ Popover          │     │ (accept)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Dismiss          │
                        │ Suggestion       │
                        └──────────────────┘
```

### Key Files

- `demo/workspaces/composables/useRelationSuggestions.ts` - Analysis and CRUD
- `demo/workspaces/components/global/workspaces/ColumnSuggestionPopover.vue` - Per-column popover
- `demo/workspaces/components/global/workspaces/dialogs/RelationSuggestionsDialog.vue` - Full dialog
- `packages/dp-mdTable/components/mdTable/header/index.vue` - Badge display

## Key Patterns

### 1. Field Names in View vs Database

- `view.fields` stores field names (strings), not IDs
- For virtual columns, uses dot notation: `"rel_company.email"`
- This allows the same field to appear multiple ways

### 2. displayFieldNames Array

Relation fields have `displayFieldNames` array:
```typescript
// On CaseFieldRecord
displayFieldNames: ['company_name', 'email', 'phone']
```
This tells the data provider which fields to fetch from the related table.

### 3. Column Properties Mapping

When converting field → column, properties are merged:
```typescript
// In fieldToColumnConfig():
column.properties = {
  ...field.displayStructure?.properties,
  relationTableId: field.relationTableId,
  displayFieldNames: field.displayFieldNames,
  displayField: field.displayFieldNames?.[0]  // Backward compat
}
```

### 4. Virtual Column Updates

Virtual columns are view-level only (no database record). When updating:
```typescript
// In updateColumn():
if (fieldName.includes('.')) {
  // Virtual column - only update local column config
  // Do NOT update the parent relation field
  columns.value[index] = { ...existingColumn, ...updates }
  return
}
```

### 5. Reactive Arrays and Worker Serialization

When passing arrays through pglite (which uses Workers), convert reactive arrays to plain arrays:
```typescript
// Bad - causes DataCloneError
emit('accepted', { displayFieldNames: formData.displayFieldNames })

// Good - spread to plain array
emit('accepted', { displayFieldNames: [...formData.displayFieldNames] })

// Or use helper
await query('...', [ensurePlainArray(displayFieldNames)])
```

## Common Tasks

### Adding a New Column Type

1. Add enum value to `ColumnFieldType` in `types/column-types.ts`
2. Create renderer in `renderers/components/`
3. Register in `renderers/render-components.ts`
4. Add settings component in `components/mdTable/addColumn/field/`
5. Add to `columnBasic.ts` for add-column dropdown
6. Update `registry-manager.ts` width map if needed

### Working with Relations

1. **Create relation**: `createRelationFromColumn(sourceField, targetTableId, targetFieldId, displayFieldNames, name)`
2. **Add virtual column**: `addVirtualColumn(relationFieldName, displayFieldName)`
3. **Update display fields**: Update `displayFieldNames` array on the relation field

### Debugging Tips

- Check `ColumnContextKey` injection for column operations
- Check `TableDataContextKey` for data operations
- Relation data is fetched in `fetchRelationDisplayData()`
- Virtual columns get data from parent relation via `sourceRelationField`

## Files Quick Reference

### Package Files (dp-mdTable)

| File | Purpose |
|------|---------|
| `composables/useMDTable.ts` | Main table composable, provides MdTableContextKey |
| `composables/useColumns.ts` | Column operations, provides ColumnContextKey |
| `types/column-types.ts` | ColumnFieldType enum and interfaces |
| `renderers/registry-manager.ts` | Registers renderers with vxe-table |
| `renderers/render-components.ts` | Maps types to renderer configs |
| `renderers/components/VirtualColumn/` | Virtual column renderer |
| `components/mdTable/index.vue` | Main table Vue component |
| `components/mdTable/addColumn/popover.vue` | Add/edit column dialog |
| `components/mdTable/addColumn/VirtualColumnDialog.vue` | Virtual column picker dialog |
| `components/mdTable/addColumn/field/Relation.vue` | Relation column settings (multi-select display fields) |
| `components/mdTable/addColumn/field/VirtualColumn.vue` | Virtual column settings |
| `components/mdTable/header/index.vue` | Column header with suggestion badge |
| `components/mdTable/header/popover.vue` | Column header context menu |

### Consumer Files (demo/workspaces)

| File | Purpose |
|------|---------|
| `composables/useTableView.ts` | Main orchestrator, combines all composables |
| `composables/useTableColumns.ts` | Field→Column mapping, virtual columns |
| `composables/useRelationSuggestions.ts` | Relation analysis and suggestion management |
| `components/workspaces/table/TableDetailView.vue` | Table container, provides columnSuggestions context |
| `components/global/workspaces/ColumnSuggestionPopover.vue` | Per-column suggestion popover |
| `components/global/workspaces/dialogs/RelationSuggestionsDialog.vue` | Full suggestions dialog |
| `components/global/workspaces/dialogs/CreateRelationDialog.vue` | Manual relation creation |
