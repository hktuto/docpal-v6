# Record Display Settings Implementation

## Overview
Implemented a comprehensive Record Display settings interface with two distinct display modes: **Link Preview** for compact inline displays and **Card View** for detailed visual cards. Each mode has its own configuration and live preview.

## Component

**`settings/RecordDisplaySettings.vue`** - Dual-mode record display configuration

## Two Display Modes

### 1. Link Preview (Small Display)
**Purpose**: Configure how records appear when linked from other tables

**Use Cases**:
- Relation field popover displays
- Inline record references
- Dropdown selections
- Quick record identification

**Configuration**:
- Select up to 3 fields (configurable max)
- Drag-to-reorder selected fields
- Field separator (default: " • ")
- Live preview of formatted text

**Example Output**:
```
🔗 John Doe • john@email.com • Sales Department
```

### 2. Card View (Large Display)
**Purpose**: Design detailed card layouts for Kanban and Gallery views

**Use Cases**:
- Kanban board cards
- Gallery view tiles
- Dashboard widgets
- Visual record browsers

**Configuration**:
- Cover image field selection (optional)
- Title field selection
- Field ordering (drag-and-drop)
- Per-field width selection:
  - 25% (1/4 width - 4 columns)
  - 33% (1/3 width - 3 columns)
  - 50% (1/2 width - 2 columns)
  - 75% (3/4 width - 1.33 columns)
  - 100% (Full width - 1 column)
- Border toggle
- Compact mode toggle
- Live card preview

## Features

### Link Preview Tab

#### 1. **Field Selection**
- Maximum field limit (default: 3)
- Visual counter showing selected/max
- Add fields with one click
- Remove fields easily
- Drag-to-reorder selected fields

#### 2. **Available Fields Pool**
- Shows all unselected fields as buttons
- Click to add to selection
- Disabled when max reached
- Excludes formula and rollup fields

#### 3. **Live Preview**
- Shows exactly how the link will appear
- Updates instantly as fields change
- Sample data for visualization
- Field separator displayed

### Card View Tab

#### 1. **Cover Image Configuration**
- Select from attachment fields
- Optional - can be left empty
- Preview shows placeholder when configured

#### 2. **Title Field Selection**
- Required field for card header
- Dropdown of all available fields
- Prominent display in preview

#### 3. **Field Configuration List**
- Drag-and-drop reordering
- Width dropdown per field
- Visual field info
- Automatic order tracking

#### 4. **Live Card Preview**
- Real-time visualization
- Shows cover image area
- Displays title prominently
- Fields laid out with proper widths
- Wrapping behavior demonstrated
- Sample data for all fields

#### 5. **Card Options**
- Show Border checkbox
- Compact Mode checkbox

## Technical Details

### Data Structures

```typescript
// Link Preview Configuration
interface LinkPreviewConfig {
  fields: string[]           // Column IDs in order
  separator: string          // Field separator (e.g., " • ")
  maxFields: number          // Maximum allowed fields
}

// Card View Field Configuration
interface CardFieldConfig {
  columnId: string           // Column ID
  width: 25 | 33 | 50 | 75 | 100  // Field width percentage
  order: number              // Display order
}

// Card View Configuration
interface CardViewConfig {
  coverImageField?: string   // Optional cover image column ID
  titleField?: string        // Title column ID
  fields: CardFieldConfig[]  // Field configurations
  showBorder: boolean        // Card border toggle
  compactMode: boolean       // Compact spacing toggle
}
```

### Key Functions

```typescript
// Link Preview
handleLinkFieldToggle(columnId)  // Add/remove field
isLinkFieldSelected(columnId)    // Check if selected

// Card View
handleWidthChange(index, width)  // Update field width
handleCardFieldsReorder()        // Update order after drag

// Saving
saveLinkPreview()                // Save link config
saveCardView()                   // Save card config

// Preview
getSampleValue(column)           // Generate sample data
```

### State Management

```typescript
activeTab                  // 'link-preview' | 'card-view'
linkPreviewConfig          // Link preview settings
cardViewConfig             // Card view settings
availableColumns           // Filtered columns
selectedLinkColumns        // Computed selected columns
cardViewFields             // Computed card fields with data
```

## UI Design

### Link Preview Tab Layout
```
┌─────────────────────────────────────────┐
│ 🔗 Compact Link Display                 │
│ Choose which fields appear when...      │
├─────────────────────────────────────────┤
│ Select Fields (up to 3)      2 / 3      │
│                                         │
│ ╔═══════ Name ════════════════ ✕       │
│ ║  Drag to reorder                     │
│ ╚═════════════════════════════════════ │
│ ╔═══════ Email ═══════════════ ✕       │
│ ╚═════════════════════════════════════ │
│                                         │
│ [+ Department] [+ Phone] [+ Status]    │
├─────────────────────────────────────────┤
│ Preview                                 │
│ 🔗 John Doe • john@email.com           │
├─────────────────────────────────────────┤
│                  [Save Settings]        │
└─────────────────────────────────────────┘
```

### Card View Tab Layout
```
┌─────────────────────────────────────────┐
│ 📇 Card Layout                          │
│ Design how records appear as cards...   │
├─────────────────────────────────────────┤
│ Cover Image: [Select field ▼]          │
│ Title Field: [Name ▼]                   │
├─────────────────────────────────────────┤
│ Card Fields                             │
│ ≡ Name         [100% Full ▼]           │
│ ≡ Email        [50% Half ▼]            │
│ ≡ Department   [50% Half ▼]            │
│ ≡ Status       [33% Third ▼]           │
├─────────────────────────────────────────┤
│ Card Preview                            │
│ ┌─────────────────────────┐            │
│ │     [Cover Image]        │            │
│ ├─────────────────────────┤            │
│ │ Name                     │            │
│ │                         │            │
│ │ Email          Dept     │            │
│ │ Status  ...    ...      │            │
│ └─────────────────────────┘            │
├─────────────────────────────────────────┤
│ ☑ Show Border  ☐ Compact Mode          │
├─────────────────────────────────────────┤
│                  [Save Settings]        │
└─────────────────────────────────────────┘
```

## Width Options Explained

| Width | Label      | Columns | Use Case                    |
|-------|------------|---------|----------------------------|
| 25%   | 1/4        | 4       | Small tags, icons, counts  |
| 33%   | 1/3        | 3       | Categories, statuses       |
| 50%   | 1/2        | 2       | Names, emails, dates       |
| 75%   | 3/4        | 1.33    | Long text, descriptions    |
| 100%  | Full       | 1       | Full-width fields, images  |

## Use Case Examples

### Link Preview Use Cases

**1. User Relation**
```
Fields: Name, Email, Department
Output: "John Doe • john@email.com • Sales"
```

**2. Project Relation**
```
Fields: Name, Status, Due Date
Output: "Website Redesign • In Progress • Mar 15, 2024"
```

**3. Product Relation**
```
Fields: Name, SKU, Price
Output: "Wireless Mouse • SKU-1234 • $29.99"
```

### Card View Use Cases

**1. Task Card (Kanban)**
```
Cover: [None]
Title: Task Name
Fields:
  - Status (33%)
  - Priority (33%)
  - Assignee (33%)
  - Due Date (50%)
  - Tags (50%)
  - Description (100%)
```

**2. Product Card (Gallery)**
```
Cover: Product Image
Title: Product Name
Fields:
  - Price (50%)
  - Stock (50%)
  - Category (33%)
  - Rating (33%)
  - SKU (33%)
  - Description (100%)
```

**3. Contact Card**
```
Cover: Profile Photo
Title: Full Name
Fields:
  - Email (50%)
  - Phone (50%)
  - Company (50%)
  - Role (50%)
  - Tags (100%)
```

## Integration

### Saving Configurations
Currently, configurations are shown in the UI. To persist:

```typescript
// In table type definition (database.ts)
interface Table {
  // ... existing fields
  linkPreviewConfig?: LinkPreviewConfig
  cardViewConfig?: CardViewConfig
}

// Save functions
function saveLinkPreview() {
  updateTable(database.id, table.id, {
    linkPreviewConfig: linkPreviewConfig.value
  })
}

function saveCardView() {
  updateTable(database.id, table.id, {
    cardViewConfig: cardViewConfig.value
  })
}
```

### Using in Components

```typescript
// In RelationPopover.vue
const linkFields = table.linkPreviewConfig?.fields || [defaultFields]
const displayText = linkFields
  .map(fieldId => record[fieldId])
  .join(table.linkPreviewConfig?.separator || ' • ')

// In KanbanView.vue
const cardConfig = table.cardViewConfig
const coverImage = cardConfig?.coverImageField
const titleField = cardConfig?.titleField
const fields = cardConfig?.fields.sort((a, b) => a.order - b.order)
```

## Responsive Behavior

- Card preview adapts to container width
- Field widths are percentage-based
- Fields wrap naturally
- Mobile-friendly touch targets
- Scrollable field lists

## Files Modified

- `components/database/TableSettingsPage.vue` - Added RecordDisplaySettings
- Created `components/database/settings/RecordDisplaySettings.vue` - New component

## Testing Checklist

### Link Preview
- [ ] Add fields up to maximum
- [ ] Remove fields
- [ ] Reorder fields by dragging
- [ ] Preview updates in real-time
- [ ] Max field limit enforced
- [ ] Save button works
- [ ] Formula/rollup fields excluded

### Card View
- [ ] Select cover image field
- [ ] Select title field
- [ ] Add/remove fields from card
- [ ] Reorder fields by dragging
- [ ] Change field widths
- [ ] Preview shows correct layout
- [ ] Fields wrap properly
- [ ] Border toggle works
- [ ] Compact mode toggle works
- [ ] Save button works

## Summary

The Record Display Settings provides a powerful dual-mode configuration system:

1. **Link Preview**: Perfect for compact, inline displays where space is limited
2. **Card View**: Ideal for visual, detailed displays with flexible layouts

**Key Benefits:**
- ✅ Two distinct display modes for different contexts
- ✅ Drag-and-drop field ordering in both modes
- ✅ Flexible width options (25%, 33%, 50%, 75%, 100%)
- ✅ Live previews for instant feedback
- ✅ Smart field filtering (excludes non-editable fields)
- ✅ Visual layout builder
- ✅ Clean, intuitive interface
- ✅ Separate configs for different use cases

This implementation provides maximum flexibility while keeping the interface clean and easy to use!

