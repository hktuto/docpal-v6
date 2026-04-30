# Form Settings Feature

Documentation for the table form configuration feature that allows customizing the Add Row dialog.

## Overview

Each table can have a form configuration that defines:
- Which fields appear in the Add Row dialog
- Field layout (single or multi-column)
- Label position and width
- Required field validation
- Custom labels per field

## Form Configuration Storage

Form config is stored in `case_tables.formStructure.form`:

```typescript
interface FormViewConfig {
  fields: ViewFieldConfig[]      // Fields to display
  layout: 'single' | 'multi'     // Form layout mode
  labelPosition: 'top' | 'left'  // Label position
  labelWidth: number             // Label width (px)
}

interface ViewFieldConfig {
  fieldName: string   // Table field name
  colSpan?: number    // Grid span (1-12)
  label?: string      // Custom label
  hidden?: boolean    // Hide field
  required?: boolean  // Required validation
}
```

## Default Form Generation

If no form config exists, a default is automatically generated:

### Excluded Fields

System fields are automatically excluded:
- `id` - Primary key
- `col_id` - Column ID
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp
- `created_by` - Creator user ID
- `updated_by` - Updater user ID
- Fields starting with `_` - Private fields
- Fields with `isHidden = true`

### Excluded Types

These field types are excluded from forms:
- Attachment (6) - File uploads
- Relation (14) - MagicLink relations
- Formula (16) - Computed fields
- Aggregation (15) - Virtual columns

### Default Settings

- All fields are full width (`colSpan: 12`)
- Layout is multi-column
- Labels are positioned at top
- Checkbox fields are not required by default

## Form Settings UI

### Accessing Form Settings

1. Navigate to a table
2. Click the settings (gear) icon
3. Select "Form" from the settings menu

### Form Editor Interface

The form editor has three main sections:

#### 1. Toolbar
- **Add Field**: Dropdown to add available fields to the form
- **Settings**: Configure form layout and label position
- **Reset**: Reset to default form configuration
- **Advanced**: Toggle advanced settings (CSS/JS/template)
- **Save/Cancel**: Save or discard changes

#### 2. Form Preview (Left Panel)
Live preview of how the form will look:
- Toggle between single and multi-column layout
- See field labels and input types
- Test field interactions

#### 3. Field List (Right Panel)
Draggable list of configured fields:
- Drag to reorder fields
- Click field actions (required, hidden, label)
- Remove fields from form

### Field Configuration

#### Making a Field Required
1. Find the field in the right panel
2. Click the actions menu (three dots)
3. Select "Make Required"
4. A red "Required" badge appears

#### Hiding a Field
1. Find the field in the right panel
2. Click the actions menu
3. Select "Hide Field"
4. Field becomes semi-transparent with strikethrough

#### Custom Label
1. Find the field in the right panel
2. Click the actions menu
3. Select "Edit Label"
4. Enter custom label text
5. Leave empty to use the field's default alias

### Form Layout Options

#### Layout Mode
- **Single Column**: All fields stack vertically
- **Multi Column**: Fields flow in a grid (default)

#### Label Position
- **Top**: Labels above inputs (default)
- **Left**: Labels to the left of inputs

#### Label Width
When using left labels, adjust the label width (80-200px).

## Add Row Dialog

### Opening the Dialog

Click the "Add Row" button in the table toolbar:
- Located in the left section of the toolbar
- Has a plus icon

### Form Behavior

1. **Loading**: Shows skeleton while loading form config
2. **Empty State**: If no fields configured, shows message with link to settings
3. **Validation**: 
   - Required fields must be filled
   - Number fields validate as numbers
   - Date fields validate as dates
   - Email fields validate email format
   - URL fields validate URL format

4. **Submission**:
   - Click "Add Row" to submit
   - Shows loading state during submission
   - Closes dialog on success
   - Table refreshes automatically

### Field Types in Forms

| Field Type | Input Component | Notes |
|------------|-----------------|-------|
| Text | Text input | Single line |
| MultiText | Textarea | Multi-line |
| Number | Number input | With step controls |
| SingleSelect | Dropdown | Select one option |
| MultiSelect | Multi-dropdown | Select multiple options |
| DateTime | Date picker | Date and time selection |
| Checkbox | Checkbox | Boolean toggle |
| Rating | Star rating | 1-5 stars |
| Email | Email input | With validation |
| URL | URL input | With link icon |
| Phone | Text input | Phone number |
| Currency | Number input | With currency symbol |
| Percent | Number input | 0-1 range |

## Technical Implementation

### Components

#### FormViewEditor
Located at: `demo/workspaces/components/global/workspaces/setting/table/form.vue`

- Loads table fields and form config
- Uses `ViewConfigFormViewEditor` from dp-mdTable
- Saves config to `case_tables.formStructure`

#### AddRowDialog
Located at: `demo/workspaces/components/workspaces/table/AddRowDialog.vue`

- Opens when "Add Row" button clicked
- Loads form config or generates default
- Uses `ViewConfigFormRenderer` for form rendering
- Calls `tableView.addRow()` on submit

#### FormRenderer
Located at: `packages/dp-mdTable/components/viewConfig/FormRenderer.vue`

- Renders form based on config
- Handles field type mapping
- Validates form data
- Emits submit event with form data

### Composables

#### useTableView.addRow()
Located at: `demo/workspaces/composables/useTableDataProvider.ts`

```typescript
async function addRow(row: any): Promise<void>
```

- Inserts row into physical table
- Auto-resolves relations based on lookup config
- Adds to `tableData` ref
- Logs audit entry

### Types

Located at: `demo/workspaces/utils/mdTable-view-config.ts`

Auto-imported via Nuxt `#imports`:

```typescript
import type { FormViewConfig, FieldInfo, ViewFieldConfig } from '#imports'
import { generateDefaultFormConfig } from '#imports'
```

## Validation Rules

### Required Fields

```typescript
{
  required: true,
  message: 'Field Name is required',
  trigger: 'blur',
  type: 'number' | 'date' | 'array' | undefined
}
```

### Type Validation

Even non-required fields have type validation:
- **Number**: Must be a valid number
- **Date**: Must be a valid date
- **Email**: Must be valid email format
- **URL**: Must be valid URL format

## Best Practices

1. **Keep forms simple**: Only include necessary fields
2. **Use multi-column layout**: For forms with many fields
3. **Set appropriate required fields**: Don't make everything required
4. **Custom labels**: Use user-friendly labels
5. **Test validation**: Ensure required fields work correctly
6. **Hide system fields**: They are auto-excluded but verify

## Troubleshooting

### Form not showing fields
- Check that fields are added to the form config
- Verify fields are not marked as hidden
- Ensure field types are supported

### Validation not working
- Check browser console for errors
- Verify field types match expected values
- Ensure `required` property is set correctly

### Default form not generating
- Check that table has fields
- Verify fields are not all system fields
- Check console for errors

### Changes not saving
- Ensure you click "Save" button
- Check for validation errors
- Verify database connection
