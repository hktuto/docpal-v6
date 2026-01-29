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
- `aggregation` - How to aggregate multiple values: `'first'`, `'last'`, `'all'`, `'count'`
- `showUniqueOnly` - Deduplicate values
- `linkToRecord` - Make values clickable to navigate
- `separator` - Separator string for text mode (default: `', '`)
- `targetFieldConfig` - (Dynamic, not persisted) Target field's display configuration for rendering

### VirtualColumnSettings
Persisted settings for a virtual column (stored in parent relation's `displayStructure.virtualColumnSettings`):
- `aggregation` - How to aggregate: `'first'`, `'last'`, `'all'`, `'count'`
- `showUniqueOnly` - Deduplicate values
- `separator` - Separator string
- `linkToRecord` - Make values clickable

### TargetFieldConfig
Dynamic configuration injected into virtual columns from the target table's field:
- `type` - Target field's ColumnFieldType (e.g., SingleSelect, Number)
- `properties` - Target field's display properties (e.g., options with colors, number formatting)

Virtual columns inherit the target field's rendering style automatically.

## Contexts

### ColumnContextKey
Vue injection key for column operations. Provides `addColumn`, `updateColumn`, `deleteColumn`, etc.

### TableDataContextKey
Vue injection key for data operations. Provides `tableData`, `addRow`, `updateRow`, `deleteRow`, etc.

### ViewContextKey
Vue injection key for view operations. Provides `currentView`, `views`, `updateView`, etc.

### MdTableContextKey
Vue injection key for the main table context. Provides access to the grid ref and helper functions.

### ColumnContext Extended Functions
Additional functions available on ColumnContext for relation features:
- `getFieldsForTable(tableId)` - Returns cached fields for a table
- `getTableCardConfig(tableId)` - Returns card view config from formStructure.card
- `getRecordById(tableId, recordId)` - Fetches a single record by ID

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

### RecordCardDialog
A popover dialog that shows a card preview of a related record when clicking on a relation tag. Uses `UiPopoverDialog` for positioning relative to the clicked element.

### CardPreview
Vue component that renders a record as a card using `CardViewConfig`. Shows title, subtitle, cover image, and configurable fields.

### CardViewConfig
Configuration for how a record is displayed as a card:
- `fields` - Array of ViewFieldConfig defining which fields to show
- `titleField` - Field to use as the card title
- `subtitleField` - Field for subtitle
- `coverField` - Attachment field for cover image
- `advanced` - Custom CSS/JS/template

### FormViewConfig
Configuration for creating/editing records via a form:
- `fields` - Array of ViewFieldConfig defining form fields
- `layout` - Form layout: `'single'` (one column) or `'multi'` (two columns)
- `labelPosition` - Label position: `'top'` or `'left'`
- `labelWidth` - Label width in pixels (when position is 'left')
- `advanced` - Custom CSS/JS/template

### ViewFieldConfig
Field configuration used in Card, Form, Detail, and List views:
- `fieldName` - The table field name
- `colSpan` - Grid column span (1-12)
- `label` - Custom label override
- `hidden` - Hide this field
- `required` - Make field required (forms only)
- `advanced` - Custom CSS/JS/template

### FormRenderer
Vue component that renders a dynamic form based on FormViewConfig. Supports validation, multiple field types, and custom layouts.

### AddRowDialog
Dialog component that opens when clicking the "Add Row" button in the table toolbar. Uses FormRenderer to display the form for creating new records.

## Patterns

### Provider/Consumer
Architecture where a parent composable "provides" context (data + functions) that child components "consume" via inject.

### Field-to-Column Mapping
The process of converting a `CaseFieldRecord` into a `ColumnConfig` for display. Handled by `fieldToColumnConfig()`.

### Dot Notation
Convention for identifying virtual columns in view.fields: `"relationFieldName.displayFieldName"` (e.g., `"rel_company.email"`).

### Target Fields Cache
A Map in `useTableColumns` that caches field definitions for target tables. Used for:
- Virtual column rendering (target field display settings)
- Card preview (loading fields without re-fetching)
Key: tableId, Value: `CaseFieldRecord[]`

### Target Table Cache
A Map in `useTableColumns` that caches table info (including `formStructure`). Used for:
- Card preview (loading card config)
- Getting physical table name for record queries
Key: tableId, Value: `CaseTableRecord`

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

### Open Record Card
Displays a card preview for a related record when clicking on a relation tag. Triggered by `relation-cell-click` grid event.

### Add Row
Opens the AddRowDialog form for creating a new record. Form fields are determined by the table's FormViewConfig.

### Submit Form
Validates form data and creates a new record. Validation includes type checking for numbers, dates, emails, and URLs.

### Reset Form
Clears form data and resets validation state. Called when closing the AddRowDialog.

### Configure Form
Opens the form settings page to customize which fields appear in the Add Row dialog and their layout.

## Import Terms

### Import to Table
Feature to import data from Excel/CSV files into an existing table with column mapping and upsert logic.

### Column Mapping
Process of matching Excel columns to table fields. Auto-suggested based on name similarity.

### Lookup Columns
Fields used to identify existing records during import. If a record matches these fields, it is updated instead of creating a new one.

### Upsert
Update-or-insert operation. Checks if record exists by lookup columns; updates if found, inserts if not.

### Update Strategy
How to handle field values during upsert:
- `'all'`: Update all mapped fields, even if Excel cell is empty
- `'non_empty'`: Only update fields where Excel has a non-empty value

### ImportToTableDialog
3-step wizard dialog for importing data:
1. Select file and sheet
2. Map columns with auto-suggestions
3. Configure lookup columns and update strategy
