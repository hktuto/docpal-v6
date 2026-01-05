# Page/Component to API Mapping

Visual guide showing which frontend components use which API endpoints.

---

## 📄 Page Structure Overview

```
Database App
├── Database List Page
├── Database Detail Page
│   ├── Navigation Sidebar
│   ├── Table View
│   ├── Kanban View
│   ├── Gallery View
│   ├── Calendar View
│   ├── Gantt View
│   ├── Dashboard View
│   ├── Folder View
│   └── Table Settings Page
│       ├── General Settings
│       ├── Fields Settings
│       ├── Forms Settings
│       ├── Record Display Settings
│       ├── Permissions Settings
│       ├── Row Security Settings
│       ├── Detail View Settings
│       └── Triggers Settings
└── Record Detail View
```

---

## 1️⃣ Database List Page

**Component**: `DatabaseList.vue`

**Purpose**: Display all databases user has access to

### APIs Used:
- `GET /api/databases` - Load all databases
- `POST /api/databases` - Create new database
- `PATCH /api/databases/:id` - Update database (inline edit)
- `DELETE /api/databases/:id` - Delete database

### User Actions:
- View all databases in grid/list
- Search databases
- Create new database
- Edit database name/description
- Delete database
- Click to open database

---

## 2️⃣ Database Detail Page

**Component**: `DatabaseDetail.vue`

**Purpose**: Main container for database content

### APIs Used:
- `GET /api/databases/:id` - Load database with structure
- `GET /api/databases/:databaseId/tables` - Load all tables
- `GET /api/databases/:databaseId/folders` - Load folder structure
- `GET /api/databases/:databaseId/dashboards` - Load dashboards
- `GET /api/databases/:databaseId/collaborators` - Load active users
- WebSocket: `/ws/collaboration` - Real-time updates

### Child Components:
- NavigationTree
- ViewRenderer (shows different view types)
- TableSettingsPage

---

## 3️⃣ Navigation Sidebar

**Component**: `NavigationTree.vue`, `NavItemComponent.vue`

**Purpose**: Show folder/table/dashboard hierarchy

### APIs Used:
- `GET /api/databases/:databaseId/folders` - Load folders
- `GET /api/databases/:databaseId/tables` - Load tables
- `POST /api/databases/:databaseId/folders` - Create folder
- `PATCH /api/databases/:databaseId/folders/:folderId` - Update folder
- `DELETE /api/databases/:databaseId/folders/:folderId` - Delete folder
- `POST /api/databases/:databaseId/folders/:folderId/items` - Move items

### User Actions:
- Expand/collapse folders
- Drag-and-drop to reorganize
- Create new folder
- Create new table
- Rename items
- Delete items

---

## 4️⃣ Table View (Grid)

**Component**: `TableView.vue`

**Purpose**: Display records in spreadsheet format

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId` - Load table structure
- `GET /api/databases/:databaseId/tables/:tableId/records` - Load records
  - Query params: `page`, `pageSize`, `sort`, `filter`, `search`
- `POST /api/databases/:databaseId/tables/:tableId/records` - Create record
- `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Update record
- `DELETE /api/databases/:databaseId/tables/:tableId/records/:recordId` - Delete record
- `POST /api/databases/:databaseId/tables/:tableId/records/bulk-delete` - Bulk delete
- `POST /api/databases/:databaseId/tables/:tableId/records/bulk-update` - Bulk update

### Features Requiring API:
- **Filtering**: Pass filter conditions in query params
- **Sorting**: Pass sort field and direction
- **Pagination**: Page number and size
- **Search**: Full-text search query
- **Inline Editing**: PATCH record on cell change
- **Right-click menu**: Edit/add column (uses Column APIs)

### Real-time Updates:
- WebSocket: `record.created`, `record.updated`, `record.deleted`

---

## 5️⃣ Kanban View

**Component**: `KanbanView.vue`

**Purpose**: Display records as cards grouped by column

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/records` - Load all records
  - Filter by view config
- `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Update when card moved
- `POST /api/databases/:databaseId/tables/:tableId/records` - Create new card

### Specific Needs:
- Group records by single-select field value
- Update groupBy field when card dragged to different column

---

## 6️⃣ Gallery View

**Component**: `GalleryView.vue`

**Purpose**: Display records as visual cards with images

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/records` - Load records
- `GET /api/files/:fileId/download` - Load attachment images for thumbnails

### Specific Needs:
- Support for attachment field URLs
- Card layout configuration from `cardViewConfig`

---

## 7️⃣ Calendar View

**Component**: `CalendarView.vue`

**Purpose**: Display records on calendar

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/records` - Load records
  - Filter by date range (current month)
- `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Update when event moved

### Specific Needs:
- Filter records by date field within visible range
- Map date field from view config

---

## 8️⃣ Gantt View

**Component**: `GanttView.vue`

**Purpose**: Display records as timeline/project plan

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/records` - Load records
- `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Update dates when task moved

### Specific Needs:
- Start date and end date fields
- Optional: Dependencies between records

---

## 9️⃣ Dashboard View

**Component**: `DashboardView.vue`

**Purpose**: Display aggregated data and charts

### APIs Used:
- `GET /api/databases/:databaseId/dashboards/:dashboardId` - Load dashboard config
- `GET /api/databases/:databaseId/dashboards/:dashboardId/data` - Load widget data
- `GET /api/databases/:databaseId/tables/:tableId/records` - For table widgets

### Specific Needs:
- Aggregation functions (COUNT, SUM, AVG, MIN, MAX)
- Group by functionality for charts
- Real-time data updates

---

## 🔟 Record Detail View

**Component**: `RecordDetailView.vue`

**Purpose**: Show/edit single record in detail

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/records/:recordId` - Load record
- `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Update field
- `DELETE /api/databases/:databaseId/tables/:tableId/records/:recordId` - Delete record
- `GET /api/databases/:databaseId/tables/:tableId/records/:recordId/history` - Audit log
- `POST /api/files/upload` - Upload attachments

### Features:
- Custom layout from `detailViewLayout`
- Relation field lookup
- Attachment upload/download
- History/audit log

---

## 1️⃣1️⃣ View Management

**Component**: `ViewPage.vue`, `AddViewDialog.vue`

**Purpose**: Manage different views of a table

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/views` - Load all views
- `GET /api/databases/:databaseId/tables/:tableId/views/:viewId` - Load view config
- `POST /api/databases/:databaseId/tables/:tableId/views` - Create view
- `PATCH /api/databases/:databaseId/tables/:tableId/views/:viewId` - Update view
- `DELETE /api/databases/:databaseId/tables/:tableId/views/:viewId` - Delete view
- `POST /api/databases/:databaseId/tables/:tableId/views/:viewId/duplicate` - Duplicate view

### User Actions:
- Create new view (Table, Kanban, Gallery, Calendar, Gantt, Dashboard)
- Edit view name
- Configure view settings (filters, sorts, groupBy)
- Delete view
- Duplicate view
- Set default view

---

## 1️⃣2️⃣ Table Settings Page

**Component**: `TableSettingsPage.vue`

**Purpose**: Central hub for all table settings

### Navigation Structure:
```
TABLE
├── General
└── Fields

INTERFACE
├── Forms
├── Record Display
└── Detail View Layout

ACCESS & SECURITY
├── Permissions
└── Row-Level Security

AUTOMATION
└── Triggers
```

---

### 1️⃣2️⃣.1️⃣ General Settings

**Component**: `settings/GeneralSettings.vue`

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId` - Load table info
- `PATCH /api/databases/:databaseId/tables/:tableId` - Update table
  ```json
  {
    "name": "string",
    "description": "string",
    "tableType": "private|public"
  }
  ```

---

### 1️⃣2️⃣.2️⃣ Fields Settings

**Component**: `settings/FieldsSettings.vue`

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/columns` - Load columns
- `POST /api/databases/:databaseId/tables/:tableId/columns` - Add field
- `PATCH /api/databases/:databaseId/tables/:tableId/columns/:columnId` - Edit field
- `DELETE /api/databases/:databaseId/tables/:tableId/columns/:columnId` - Delete field
- `POST /api/databases/:databaseId/tables/:tableId/columns/reorder` - Reorder fields

### User Actions:
- View all fields
- Add new field (opens ColumnEditor)
- Edit field properties
- Delete field
- Drag-and-drop to reorder

---

### 1️⃣2️⃣.3️⃣ Forms Settings

**Component**: `settings/FormsSettings.vue`

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId` - Load table structure
- `PATCH /api/databases/:databaseId/tables/:tableId` - Update form config
  ```json
  {
    "formConfig": {
      "layout": "1-column|2-column",
      "sections": [...],
      "fieldOrder": [...]
    }
  }
  ```

### User Actions:
- Preview default form
- Click "Edit Form" to open form builder (external component)

---

### 1️⃣2️⃣.4️⃣ Record Display Settings

**Component**: `settings/RecordDisplaySettings.vue`

### APIs Used:
- `PATCH /api/databases/:databaseId/tables/:tableId` - Save display configs
  ```json
  {
    "linkPreviewConfig": {
      "fields": ["field1", "field2", "field3"],
      "separator": "•"
    },
    "cardViewConfig": {
      "coverImageField": "attachmentField",
      "titleField": "nameField",
      "fields": [
        { "columnId": "field1", "width": 100 },
        { "columnId": "field2", "width": 50 }
      ]
    }
  }
  ```

### User Actions:
- Configure link preview (fields to show in relations)
- Configure card view layout (for Kanban/Gallery)
- Live preview of configurations

---

### 1️⃣2️⃣.5️⃣ Permissions Settings

**Component**: `settings/PermissionsSettings.vue`

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/permissions` - Load permissions
- `POST /api/databases/:databaseId/tables/:tableId/permissions` - Add permission
  ```json
  {
    "subjectType": "user|group|role",
    "subjectId": "string",
    "permission": "view|create|edit|manage"
  }
  ```
- `DELETE /api/databases/:databaseId/tables/:tableId/permissions/:permissionId` - Remove
- `GET /api/users` - Load users for dropdown
- `GET /api/groups` - Load groups for dropdown
- `GET /api/roles` - Load roles for dropdown

### User Actions:
- View all permissions
- Add new permission assignment
- Edit permission level
- Remove permission

---

### 1️⃣2️⃣.6️⃣ Row-Level Security Settings

**Component**: `settings/RowSecuritySettings.vue`

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/row-security` - Load conditions
- `POST /api/databases/:databaseId/tables/:tableId/row-security` - Add condition
  ```json
  {
    "name": "string",
    "subjectType": "user|group|role",
    "subjectId": "string",
    "conditions": [
      {
        "field": "assignee",
        "operator": "equals",
        "value": "{{currentUser}}"
      }
    ]
  }
  ```
- `DELETE /api/databases/:databaseId/tables/:tableId/row-security/:conditionId` - Remove

### User Actions:
- View all RLS conditions
- Add new condition (who can see which rows)
- Edit conditions
- Delete conditions

---

### 1️⃣2️⃣.7️⃣ Detail View Settings

**Component**: `settings/DetailViewSettings.vue`

### APIs Used:
- `PATCH /api/databases/:databaseId/tables/:tableId` - Save layout
  ```json
  {
    "detailViewLayout": {
      "sections": [
        {
          "title": "Basic Info",
          "columns": 2,
          "fields": ["field1", "field2"]
        }
      ]
    }
  }
  ```

### User Actions:
- Configure detail view layout
- Add/remove sections
- Drag fields between sections
- Set column count per section

---

### 1️⃣2️⃣.8️⃣ Triggers Settings

**Component**: `settings/TriggersSettings.vue`

**Purpose**: Automation rules for table

### APIs Used:
- `GET /api/databases/:databaseId/tables/:tableId/triggers` - Load triggers
- `POST /api/databases/:databaseId/tables/:tableId/triggers` - Create trigger
  ```json
  {
    "name": "string",
    "description": "string",
    "enabled": true,
    "event": "record.created|record.updated|record.deleted|field.changed",
    "watchField": "string",
    "conditions": [...],
    "conditionLogic": "AND|OR",
    "actions": [
      {
        "type": "send_to_workflow",
        "config": {
          "workflowId": "string",
          "includeFullData": true,
          "includeRelated": false
        }
      }
    ]
  }
  ```
- `PATCH /api/databases/:databaseId/tables/:tableId/triggers/:triggerId` - Update
- `DELETE /api/databases/:databaseId/tables/:tableId/triggers/:triggerId` - Delete
- `POST /api/databases/:databaseId/tables/:tableId/triggers/:triggerId/toggle` - Enable/disable
- `POST /api/databases/:databaseId/tables/:tableId/triggers/test` - Test triggers
- `GET /api/workflows` - Load available workflows

### View Modes:
1. **List View** - Card-based display
2. **Decision Table** - Tabular comparison view
3. **Graph View** - Visual flow diagram (future)

### User Actions:
- View triggers in multiple layouts
- Create new trigger
- Edit trigger configuration
- Enable/disable triggers
- Delete triggers
- Test triggers with sample data

---

## 1️⃣3️⃣ Column Editor

**Component**: `ColumnEditor.vue`

**Purpose**: Create/edit table columns

### APIs Used:
- `POST /api/databases/:databaseId/tables/:tableId/columns` - Create column
- `PATCH /api/databases/:databaseId/tables/:tableId/columns/:columnId` - Update column
- `GET /api/databases/:databaseId/tables` - Load tables for relation field
- `GET /api/databases/:databaseId/tables/:tableId/columns` - Load columns for lookup/rollup

### Column Type Specific Config:
- **Select**: Options with colors
- **Relation**: Target table, relation type (1:1, 1:N, N:N)
- **Lookup**: Source relation, target field
- **Formula**: Expression/formula string
- **Rollup**: Source relation, target field, aggregation function
- **Rating**: Max rating value
- **Currency**: Currency code

---

## 1️⃣4️⃣ Filter Builder

**Component**: `FilterBuilder.vue`

**Purpose**: Reusable component for building filter conditions

### Used By:
- TableView (filtering records)
- TriggersSettings (trigger conditions)
- RowSecuritySettings (RLS conditions)
- ViewPage (view filters)

### No Direct APIs:
Emits filter conditions that parent components use in their API calls

---

## 1️⃣5️⃣ Responsive Filter

**Component**: `ResponsiveFilter.vue`

**Purpose**: Advanced filtering with search and multiple filters

### Used By:
- TableView (toolbar filtering)

### No Direct APIs:
Emits filter changes that TableView uses in record API calls

---

## 📊 API Call Frequency Matrix

| Component | High Frequency | Medium Frequency | Low Frequency |
|-----------|----------------|------------------|---------------|
| TableView | GET records | PATCH record | POST/DELETE record |
| KanbanView | GET records | PATCH record | POST record |
| RecordDetail | GET record | PATCH record | GET history |
| NavigationTree | - | GET folders/tables | POST/PATCH/DELETE |
| TriggersSettings | - | - | GET/POST/PATCH triggers |
| FieldsSettings | - | GET columns | POST/PATCH/DELETE columns |

### Optimization Recommendations:
1. **High Frequency**: Implement caching, debouncing, optimistic updates
2. **Medium Frequency**: Standard caching
3. **Low Frequency**: No special optimization needed

---

## 🔄 Real-time Sync Strategy

### Components Requiring Real-time Updates:
1. **TableView**: Record changes by other users
2. **KanbanView**: Card movements
3. **NavigationTree**: New tables/folders
4. **RecordDetail**: Field changes while viewing
5. **Collaborators**: Active users

### WebSocket Event Handling:
```typescript
// Frontend subscription pattern
ws.on('record.updated', (data) => {
  // Update local record if in current view
  if (currentTableId === data.tableId) {
    updateRecord(data.recordId, data.fields)
  }
})

ws.on('user.joined', (user) => {
  // Add to collaborators list
  addCollaborator(user)
})
```

---

## 🎯 Critical Path APIs

These APIs are most critical for the app to function:

### Must Have (P0):
1. `GET /api/databases` - Can't see databases
2. `GET /api/databases/:id` - Can't open database
3. `GET /api/databases/:databaseId/tables/:tableId/records` - Can't see data
4. `POST /api/databases/:databaseId/tables/:tableId/records` - Can't add data
5. `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId` - Can't edit data

### High Priority (P1):
6. Column CRUD - Can't customize structure
7. Table CRUD - Can't organize data
8. View management - Can't create different views
9. Filtering/sorting - Can't find data

### Medium Priority (P2):
10. Triggers - Can't automate
11. Permissions - Can't control access
12. Dashboard - Can't visualize data

---

## 🧪 Test Data Requirements

For each API endpoint, backend should provide:
1. **Test data sets** (small, medium, large)
2. **Error scenarios** (validation errors, permission denied, etc.)
3. **Edge cases** (empty data, malformed requests)

---

## 📞 API Health Checks

Suggest implementing these monitoring endpoints:
- `GET /api/health` - System health
- `GET /api/health/database` - Database connectivity
- `GET /api/health/websocket` - WebSocket status

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Next Review**: After MVP implementation

