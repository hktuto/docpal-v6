# Glossary

Key terminology used in the dp-mdTable package.

## Core Terms

### Column
A display definition that determines how data is shown in the table. Columns have a `type` (ColumnFieldType) and `properties` for configuration.

### Field
The underlying data schema definition stored in the database (`CaseFieldRecord`). Fields define what data exists; columns define how it's displayed.

### View
A saved configuration of which columns to show and in what order, plus filter/sort/group settings (`CaseViewRecord`).

### Renderer
A function that converts data to visual output. Each column type has a `view` renderer (display) and `edit` renderer (input).

## Column Types

### MagicLink (type 14)
A relation column that links records to another table. Stores an array of UUIDs referencing related records. Has `displayFieldNames` to specify which fields from the related table to show.

Also referred to as: Relation, Link, Reference

### VirtualColumn (type 15)
A derived column that extracts ONE specific field from a MagicLink relation and displays it as a separate column. Virtual columns are read-only.

Example: A "Company" MagicLink shows "Name, Email, Phone". A virtual column "rel_company.email" shows only the email as a sortable/filterable column.

### Formula (type 16)
A computed column whose value is calculated from a formula expression. Supports functions like `SUM()`, `DATEDIF()`, `IF()`, etc.

## Properties

### displayFieldNames
Array of field names (strings) on a relation field specifying which fields to fetch from the related table.

```typescript
displayFieldNames: ['company_name', 'email', 'phone']
```

### sourceRelationField
On a VirtualColumn, the field name of the parent MagicLink relation.

### displayFieldName
On a VirtualColumn, which specific field from the relation to display.

### relationTableId
UUID of the target table for MagicLink/VirtualColumn relations.

### VirtualColumnOptions
Settings specific to virtual columns:
- `sourceRelationField` - Parent relation field name
- `displayFieldName` - Which field from the relation to show
- `displayMode` - How to render: `'text'`, `'chips'`, `'list'`, `'link'`
- `aggregation` - How to aggregate multiple values: `'first'`, `'last'`, `'all'`, `'count'`
- `showUniqueOnly` - Deduplicate values
- `linkToRecord` - Make values clickable to navigate
- `separator` - Separator string for text mode (default: `', '`)

## Contexts

### ColumnContextKey
Vue injection key for column operations. Provides `addColumn`, `updateColumn`, `deleteColumn`, etc.

### TableDataContextKey
Vue injection key for data operations. Provides `tableData`, `addRow`, `updateRow`, `deleteRow`, etc.

### ViewContextKey
Vue injection key for view operations. Provides `currentView`, `views`, `updateView`, etc.

### MdTableContextKey
Vue injection key for the main table context. Provides access to the grid ref and helper functions.

### columnSuggestions (inject key)
Consumer-level injection (from TableDetailView) providing suggestion data to headers:
- `getSuggestionCount(fieldName)` - Returns count of pending suggestions
- `getFieldId(fieldName)` - Returns the field's UUID
- `openSuggestionPopover(fieldName, fieldId, target)` - Opens the suggestion popover

## Database Schema

### CaseTableRecord
Table metadata: `id`, `name`, `tableName` (physical name), `entityId`.

### CaseFieldRecord
Field definition: `fieldName`, `fieldNameAlias`, `businessType`, `fieldType`, `displayStructure`, relation fields.

### CaseViewRecord
View configuration: `name`, `fields` (ordered array), `filters`, `sorts`, `groups`.

## UI Components

### Popover
A floating panel for settings or menus. Used for column settings (`addColumn/popover.vue`) and header menu (`header/popover.vue`).

### Grid
The vxe-table grid component that renders the actual table.

### Toolbar
Top bar with actions like add column, filter, sort, group buttons.

### Suggestion Badge
A small indicator (sparkle icon with count) shown in column headers when relation suggestions are available. Clicking opens the ColumnSuggestionPopover.

### ColumnSuggestionPopover
A lightweight popover that appears when clicking a suggestion badge. Shows suggestions for that specific column with options to accept (create relation) or dismiss.

### RelationSuggestionsDialog
A full dialog showing all pending relation suggestions for a table, accessible from the table toolbar.

## Patterns

### Provider/Consumer
Architecture where a parent composable "provides" context (data + functions) that child components "consume" via inject.

### Field-to-Column Mapping
The process of converting a `CaseFieldRecord` into a `ColumnConfig` for display. Handled by `fieldToColumnConfig()`.

### Dot Notation
Convention for identifying virtual columns in view.fields: `"relationFieldName.displayFieldName"` (e.g., `"rel_company.email"`).

## Relation Suggestions

### Relation Suggestion
An automatically detected potential relation between two tables based on matching field values. Stored in `relation_suggestions` table.

### Suggestion Status
State of a suggestion: `pending` (awaiting user action), `accepted` (relation created), `dismissed` (ignored by user).

### Match Rate
Percentage of source field values that match values in the target table's field. Suggestions require >50% match rate.

### Match Reason
Why a suggestion was created: `name_and_value` (field names similar AND values match) or `value_only` (just values match).

## Actions

### Add Column
Creates a new field and adds it to the current view's fields array.

### Update Column
Modifies column settings (title, properties, etc.) and persists to database. For virtual columns, only updates local config.

### Delete Column
Removes a field from the table schema and all views. For virtual columns, only removes from view.fields.

### Add Virtual Column
Creates a new VirtualColumn from an existing MagicLink, showing a single display field as a separate column.

### Save Column Order
Persists the current order of columns in view.fields after drag-drop reordering.

### Accept Suggestion
Creates a relation from a suggestion, marks it as accepted, and dismisses other suggestions for the same target table.

### Dismiss Suggestion
Marks a suggestion as dismissed so it won't be shown again.
