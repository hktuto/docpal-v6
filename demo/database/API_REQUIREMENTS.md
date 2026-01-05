# Database Management System - API Requirements

## Project Overview
A comprehensive database management system with multiple view types, automation, permissions, and collaboration features. Similar to Airtable/Notion databases.

---

## 📋 Complete Feature List

### 1. **Database Management**
- ✅ Create, read, update, delete databases
- ✅ Database list view with search and filtering
- ✅ Database metadata (name, description, icon, color)
- ✅ Database-level permissions
- ✅ Folder organization within databases

### 2. **Table Management**
- ✅ Create, read, update, delete tables
- ✅ Table metadata (name, description, type)
- ✅ Table types: Private vs Public (affects linking and sharing)
- ✅ Table-level permissions (view, create, edit, manage)
- ✅ Permission assignments by user, group, or role
- ✅ Row-level security with conditions

### 3. **Column/Field Management**
- ✅ Dynamic column types:
  - Text, Number, Date, Checkbox
  - Single Select, Multi Select
  - Email, URL, Phone
  - Rating, Currency
  - Relation (link to other tables)
  - Lookup (from related tables)
  - Formula (fx)
  - Rollup
  - Attachment/File
- ✅ Column properties (required, unique, default value)
- ✅ Drag-and-drop column reordering
- ✅ Column-level visibility control
- ✅ Column formatting options

### 4. **View Types**
- ✅ **Table View** (Grid/Spreadsheet)
  - Sorting, filtering, grouping
  - Column freezing
  - Row selection and bulk actions
  - Inline editing
  - Right-click context menu
  - Advanced filtering with ResponsiveFilter
- ✅ **Kanban View** (Board)
  - Group by single-select fields
  - Drag-and-drop cards between columns
  - Card customization
- ✅ **Gallery View** (Card Grid)
  - Configurable card layouts
  - Image thumbnails
  - Responsive grid
- ✅ **Calendar View**
  - Month, week, day views
  - Event creation and editing
  - Date field mapping
- ✅ **Gantt View** (Timeline)
  - Task dependencies
  - Start/end date mapping
  - Progress tracking
- ✅ **Dashboard View**
  - Widget system (charts, metrics, tables)
  - Customizable layouts
  - Real-time statistics

### 5. **Record Management**
- ✅ Create, read, update, delete records
- ✅ Bulk operations (delete, update)
- ✅ Record detail view with customizable layout
- ✅ Record history/audit log
- ✅ Record linking (relations)
- ✅ Record comments/notes
- ✅ Record attachments

### 6. **Forms**
- ✅ Custom form builder
- ✅ Form preview
- ✅ Field validation rules
- ✅ Conditional field visibility
- ✅ Form layout configuration

### 7. **Automation & Triggers**
- ✅ Event-based triggers:
  - Record created
  - Record updated
  - Record deleted
  - Field changed
- ✅ Conditional logic (AND/OR)
- ✅ Actions: Send to workflow
- ✅ Trigger enable/disable
- ✅ Trigger execution statistics
- ✅ Test trigger functionality
- ✅ Multiple view modes (List, Decision Table, Graph*)

### 8. **Permissions & Security**
- ✅ Database-level permissions
- ✅ Table-level permissions
- ✅ View-level permissions
- ✅ Folder-level permissions
- ✅ Row-level security (RLS) with conditions
- ✅ Permission inheritance with overrides
- ✅ User, group, and role-based access control

### 9. **Collaboration**
- ✅ User presence indicators
- ✅ Real-time collaboration
- ✅ User avatars display
- ✅ Share and invite features

### 10. **UI/UX Features**
- ✅ Unified header across all views
- ✅ Breadcrumb navigation
- ✅ Responsive design
- ✅ Drag-and-drop interfaces
- ✅ Context menus
- ✅ Tooltips and help text
- ✅ Loading states and error handling
- ✅ Empty states with guidance

---

## 🔌 API Endpoints Required

### **1. Database APIs**

#### `GET /api/databases`
Get list of all databases user has access to
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "color": "string",
      "createdAt": "datetime",
      "createdBy": "string",
      "updatedAt": "datetime",
      "permissions": [...]
    }
  ]
}
```

#### `GET /api/databases/:id`
Get single database with all tables, views, and folders
```json
Response: {
  "id": "string",
  "name": "string",
  "description": "string",
  "icon": "string",
  "color": "string",
  "tables": [...],
  "folders": [...],
  "permissions": [...],
  "createdAt": "datetime",
  "createdBy": "string",
  "updatedAt": "datetime"
}
```

#### `POST /api/databases`
Create new database
```json
Request: {
  "name": "string",
  "description": "string",
  "icon": "string",
  "color": "string"
}
Response: { "id": "string", ... }
```

#### `PATCH /api/databases/:id`
Update database
```json
Request: {
  "name": "string",
  "description": "string",
  "icon": "string",
  "color": "string"
}
```

#### `DELETE /api/databases/:id`
Delete database

---

### **2. Table APIs**

#### `GET /api/databases/:databaseId/tables`
Get all tables in a database
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "tableType": "private|public",
      "columns": [...],
      "views": [...],
      "recordCount": "number",
      "createdAt": "datetime"
    }
  ]
}
```

#### `GET /api/databases/:databaseId/tables/:tableId`
Get single table with full details
```json
Response: {
  "id": "string",
  "name": "string",
  "description": "string",
  "icon": "string",
  "tableType": "private|public",
  "columns": [...],
  "views": [...],
  "permissions": [...],
  "rowLevelConditions": [...],
  "triggers": [...],
  "detailViewLayout": {...},
  "linkPreviewConfig": {...},
  "cardViewConfig": {...},
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### `POST /api/databases/:databaseId/tables`
Create new table
```json
Request: {
  "name": "string",
  "description": "string",
  "icon": "string",
  "tableType": "private|public",
  "columns": [...]  // Initial columns
}
```

#### `PATCH /api/databases/:databaseId/tables/:tableId`
Update table metadata
```json
Request: {
  "name": "string",
  "description": "string",
  "tableType": "private|public",
  "permissions": [...],
  "rowLevelConditions": [...],
  "detailViewLayout": {...},
  "linkPreviewConfig": {...},
  "cardViewConfig": {...}
}
```

#### `DELETE /api/databases/:databaseId/tables/:tableId`
Delete table

---

### **3. Column/Field APIs**

#### `GET /api/databases/:databaseId/tables/:tableId/columns`
Get all columns for a table
```json
Response: {
  "data": [
    {
      "id": "string",
      "field": "string",  // Internal field name
      "title": "string",  // Display name
      "type": "text|number|date|...",
      "required": "boolean",
      "unique": "boolean",
      "options": [...],  // For select fields
      "relationConfig": {...},  // For relation fields
      "lookupConfig": {...},  // For lookup fields
      "formulaConfig": {...},  // For formula fields
      "rollupConfig": {...},  // For rollup fields
      "format": {...},  // Formatting options
      "width": "number",
      "visible": "boolean",
      "order": "number"
    }
  ]
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/columns`
Create new column
```json
Request: {
  "field": "string",
  "title": "string",
  "type": "string",
  "required": "boolean",
  "options": [...],
  "relationConfig": {...},
  // ... other config based on type
}
```

#### `PATCH /api/databases/:databaseId/tables/:tableId/columns/:columnId`
Update column
```json
Request: {
  "title": "string",
  "required": "boolean",
  "options": [...],
  // ... other updatable fields
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/columns/reorder`
Reorder columns
```json
Request: {
  "columnIds": ["col1", "col2", "col3"]  // New order
}
```

#### `DELETE /api/databases/:databaseId/tables/:tableId/columns/:columnId`
Delete column

---

### **4. Record/Data APIs**

#### `GET /api/databases/:databaseId/tables/:tableId/records`
Get records with filtering, sorting, pagination
```json
Query Parameters:
  - page: number
  - pageSize: number
  - sort: field:asc|desc
  - filter: JSON string with filter conditions
  - search: string (full-text search)
  - viewId: string (apply view filters)

Response: {
  "data": [
    {
      "id": "string",
      "fields": {
        "field1": "value1",
        "field2": "value2",
      },
      "createdAt": "datetime",
      "createdBy": "string",
      "updatedAt": "datetime",
      "updatedBy": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

#### `GET /api/databases/:databaseId/tables/:tableId/records/:recordId`
Get single record
```json
Response: {
  "id": "string",
  "fields": {...},
  "createdAt": "datetime",
  "createdBy": "string",
  "updatedAt": "datetime",
  "updatedBy": "string",
  "history": [...]  // Audit log
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/records`
Create new record
```json
Request: {
  "fields": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

#### `PATCH /api/databases/:databaseId/tables/:tableId/records/:recordId`
Update record
```json
Request: {
  "fields": {
    "field1": "newValue1"
  }
}
```

#### `DELETE /api/databases/:databaseId/tables/:tableId/records/:recordId`
Delete record

#### `POST /api/databases/:databaseId/tables/:tableId/records/bulk-delete`
Bulk delete records
```json
Request: {
  "recordIds": ["id1", "id2", "id3"]
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/records/bulk-update`
Bulk update records
```json
Request: {
  "recordIds": ["id1", "id2"],
  "fields": {
    "status": "completed"
  }
}
```

---

### **5. View APIs**

#### `GET /api/databases/:databaseId/tables/:tableId/views`
Get all views for a table
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "table|kanban|gallery|calendar|gantt|dashboard",
      "config": {...},  // View-specific config
      "filters": [...],
      "sorts": [...],
      "groupBy": "string",
      "permissions": [...],
      "isDefault": "boolean",
      "createdAt": "datetime"
    }
  ]
}
```

#### `GET /api/databases/:databaseId/tables/:tableId/views/:viewId`
Get single view
```json
Response: {
  "id": "string",
  "name": "string",
  "type": "string",
  "config": {...},
  "filters": [...],
  "sorts": [...],
  "groupBy": "string",
  "permissions": [...],
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/views`
Create new view
```json
Request: {
  "name": "string",
  "type": "table|kanban|gallery|calendar|gantt|dashboard",
  "config": {...},
  "filters": [...],
  "sorts": [...],
  "groupBy": "string"
}
```

#### `PATCH /api/databases/:databaseId/tables/:tableId/views/:viewId`
Update view
```json
Request: {
  "name": "string",
  "config": {...},
  "filters": [...],
  "sorts": [...]
}
```

#### `DELETE /api/databases/:databaseId/tables/:tableId/views/:viewId`
Delete view

#### `POST /api/databases/:databaseId/tables/:tableId/views/:viewId/duplicate`
Duplicate view

---

### **6. Dashboard APIs**

#### `GET /api/databases/:databaseId/dashboards`
Get all dashboards
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "widgets": [...],
      "layout": {...},
      "permissions": [...],
      "createdAt": "datetime"
    }
  ]
}
```

#### `GET /api/databases/:databaseId/dashboards/:dashboardId`
Get single dashboard

#### `POST /api/databases/:databaseId/dashboards`
Create dashboard

#### `PATCH /api/databases/:databaseId/dashboards/:dashboardId`
Update dashboard

#### `DELETE /api/databases/:databaseId/dashboards/:dashboardId`
Delete dashboard

#### `GET /api/databases/:databaseId/dashboards/:dashboardId/data`
Get dashboard data (aggregated data for all widgets)
```json
Response: {
  "widgets": {
    "widget1": { "value": 123, "trend": "+5%" },
    "widget2": { "data": [...] }
  }
}
```

---

### **7. Folder APIs**

#### `GET /api/databases/:databaseId/folders`
Get all folders
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "parentId": "string|null",
      "icon": "string",
      "permissions": [...],
      "items": ["tableId1", "dashboardId1"],  // Item IDs in folder
      "order": "number"
    }
  ]
}
```

#### `POST /api/databases/:databaseId/folders`
Create folder
```json
Request: {
  "name": "string",
  "parentId": "string|null",
  "icon": "string"
}
```

#### `PATCH /api/databases/:databaseId/folders/:folderId`
Update folder

#### `DELETE /api/databases/:databaseId/folders/:folderId`
Delete folder

#### `POST /api/databases/:databaseId/folders/:folderId/items`
Add items to folder
```json
Request: {
  "itemIds": ["item1", "item2"],
  "itemType": "table|dashboard"
}
```

---

### **8. Trigger/Automation APIs**

#### `GET /api/databases/:databaseId/tables/:tableId/triggers`
Get all triggers for a table
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "enabled": "boolean",
      "event": "record.created|record.updated|record.deleted|field.changed",
      "watchField": "string",  // For field.changed event
      "conditions": [...],
      "conditionLogic": "AND|OR",
      "actions": [...],
      "executionCount": "number",
      "lastTriggered": "datetime",
      "createdAt": "datetime"
    }
  ]
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/triggers`
Create trigger
```json
Request: {
  "name": "string",
  "description": "string",
  "enabled": "boolean",
  "event": "string",
  "watchField": "string",
  "conditions": [...],
  "conditionLogic": "AND|OR",
  "actions": [...]
}
```

#### `PATCH /api/databases/:databaseId/tables/:tableId/triggers/:triggerId`
Update trigger

#### `DELETE /api/databases/:databaseId/tables/:tableId/triggers/:triggerId`
Delete trigger

#### `POST /api/databases/:databaseId/tables/:tableId/triggers/:triggerId/toggle`
Enable/disable trigger
```json
Request: {
  "enabled": "boolean"
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/triggers/test`
Test triggers with sample data
```json
Request: {
  "event": "record.created",
  "data": {
    "field1": "value1"
  }
}
Response: {
  "matchedTriggers": [
    {
      "triggerId": "string",
      "triggerName": "string",
      "matched": "boolean",
      "workflow": "string"
    }
  ]
}
```

---

### **9. Permission APIs**

#### `GET /api/databases/:databaseId/permissions`
Get database permissions

#### `POST /api/databases/:databaseId/permissions`
Add database permission
```json
Request: {
  "subjectType": "user|group|role",
  "subjectId": "string",
  "permission": "view|create|edit|manage"
}
```

#### `GET /api/databases/:databaseId/tables/:tableId/permissions`
Get table permissions

#### `POST /api/databases/:databaseId/tables/:tableId/permissions`
Add table permission

#### `DELETE /api/databases/:databaseId/tables/:tableId/permissions/:permissionId`
Remove permission

#### `GET /api/databases/:databaseId/tables/:tableId/row-security`
Get row-level security conditions

#### `POST /api/databases/:databaseId/tables/:tableId/row-security`
Add row-level security condition
```json
Request: {
  "subjectType": "user|group|role",
  "subjectId": "string",
  "conditions": [...]  // Filter conditions
}
```

---

### **10. User & Collaboration APIs**

#### `GET /api/users`
Get list of users (for assignment, permissions)
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string"
    }
  ]
}
```

#### `GET /api/groups`
Get list of groups
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "members": ["userId1", "userId2"]
    }
  ]
}
```

#### `GET /api/roles`
Get list of roles
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "permissions": [...]
    }
  ]
}
```

#### `GET /api/databases/:databaseId/collaborators`
Get active collaborators for a database
```json
Response: {
  "data": [
    {
      "userId": "string",
      "name": "string",
      "avatar": "string",
      "lastActive": "datetime",
      "currentView": "string"
    }
  ]
}
```

#### WebSocket: `/ws/collaboration`
Real-time collaboration events
```
Events:
  - user.joined
  - user.left
  - record.updated (by other user)
  - view.changed
  - cursor.moved
```

---

### **11. File/Attachment APIs**

#### `POST /api/files/upload`
Upload file for attachment fields
```json
Request: multipart/form-data
Response: {
  "id": "string",
  "name": "string",
  "url": "string",
  "size": "number",
  "type": "string",
  "thumbnailUrl": "string"  // For images
}
```

#### `DELETE /api/files/:fileId`
Delete file

#### `GET /api/files/:fileId/download`
Download file

---

### **12. Workflow APIs**

#### `GET /api/workflows`
Get list of available workflows
```json
Response: {
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```

#### `POST /api/workflows/:workflowId/execute`
Manually execute workflow (used by triggers)
```json
Request: {
  "triggerId": "string",
  "data": {...},  // Record data
  "includeRelated": "boolean"
}
```

---

### **13. Search & Export APIs**

#### `GET /api/databases/:databaseId/search`
Global search across tables
```json
Query: ?q=searchTerm&tables=table1,table2
Response: {
  "results": [
    {
      "tableId": "string",
      "tableName": "string",
      "recordId": "string",
      "fields": {...},
      "matchedFields": ["field1", "field2"]
    }
  ]
}
```

#### `POST /api/databases/:databaseId/tables/:tableId/export`
Export table data
```json
Request: {
  "format": "csv|json|excel",
  "viewId": "string",  // Optional: export specific view
  "includeRelations": "boolean"
}
Response: {
  "downloadUrl": "string"
}
```

---

## 📊 Data Models

### Database
```typescript
interface Database {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  tables: Table[]
  folders: Folder[]
  dashboards: Dashboard[]
  permissions: PermissionAssignment[]
  createdAt: string
  createdBy: string
  updatedAt: string
}
```

### Table
```typescript
interface Table {
  id: string
  databaseId: string
  name: string
  description?: string
  icon?: string
  tableType: 'private' | 'public'
  columns: Column[]
  views: View[]
  permissions: PermissionAssignment[]
  rowLevelConditions: RowLevelCondition[]
  triggers: Trigger[]
  detailViewLayout?: DetailViewLayout
  linkPreviewConfig?: LinkPreviewConfig
  cardViewConfig?: CardViewConfig
  recordCount: number
  createdAt: string
  updatedAt: string
}
```

### Column
```typescript
interface Column {
  id: string
  field: string  // Internal field name (snake_case)
  title: string  // Display name
  type: ColumnType
  required: boolean
  unique: boolean
  defaultValue?: any
  options?: SelectOption[]  // For select fields
  relationConfig?: RelationConfig
  lookupConfig?: LookupConfig
  formulaConfig?: FormulaConfig
  rollupConfig?: RollupConfig
  format?: FormatConfig
  width?: number
  visible: boolean
  order: number
}

type ColumnType = 
  | 'text' | 'number' | 'date' | 'datetime' | 'checkbox'
  | 'single-select' | 'multi-select'
  | 'email' | 'url' | 'phone'
  | 'rating' | 'currency'
  | 'relation' | 'lookup' | 'fx' | 'rollup'
  | 'attachment' | 'user' | 'created-time' | 'updated-time'
```

### View
```typescript
interface View {
  id: string
  tableId: string
  name: string
  type: 'table' | 'kanban' | 'gallery' | 'calendar' | 'gantt' | 'dashboard'
  config: ViewConfig
  filters: FilterCondition[]
  sorts: SortCondition[]
  groupBy?: string
  hiddenFields?: string[]
  permissions: PermissionAssignment[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
```

### Trigger
```typescript
interface Trigger {
  id: string
  tableId: string
  name: string
  description?: string
  enabled: boolean
  event: 'record.created' | 'record.updated' | 'record.deleted' | 'field.changed'
  watchField?: string
  conditions: FilterCondition[]
  conditionLogic: 'AND' | 'OR'
  actions: TriggerAction[]
  executionCount: number
  lastTriggered?: string
  createdAt: string
  createdBy: string
}
```

### FilterCondition
```typescript
interface FilterCondition {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty'
  value?: any
}
```

---

## 🔄 Real-time Requirements

### WebSocket Events
Frontend needs to subscribe to these real-time events:

1. **Record Events**
   - `record.created`
   - `record.updated`
   - `record.deleted`

2. **Collaboration Events**
   - `user.joined`
   - `user.left`
   - `user.viewing` (what view/record they're looking at)

3. **Trigger Events**
   - `trigger.executed`
   - `trigger.failed`

---

## 🔐 Authentication & Authorization

All API requests require:
- **Authentication**: Bearer token in `Authorization` header
- **Permission Checks**: Backend must validate user permissions for each operation

Permission Hierarchy:
1. Database permissions (inherited by all tables)
2. Table permissions (override database permissions)
3. View permissions (override table permissions)
4. Row-level security (filter visible records)

---

## 📈 Performance Considerations

1. **Pagination**: All list endpoints should support pagination
2. **Caching**: Frequently accessed data (users, groups, roles) should be cacheable
3. **Lazy Loading**: Large datasets should support cursor-based pagination
4. **Batch Operations**: Support bulk create/update/delete for records
5. **Incremental Sync**: Support delta sync for real-time updates

---

## 🎯 Priority Levels

### Phase 1 (MVP)
- ✅ Database CRUD
- ✅ Table CRUD
- ✅ Column CRUD
- ✅ Record CRUD
- ✅ Table view with filtering/sorting
- ✅ Basic permissions

### Phase 2 (Enhanced Features)
- ✅ Multiple view types (Kanban, Gallery, Calendar)
- ✅ View management
- ✅ Advanced filtering
- ✅ Row-level security
- ✅ Triggers/Automation

### Phase 3 (Advanced Features)
- Dashboard with widgets
- Workflow integration
- Advanced collaboration
- Export/Import
- API webhooks

---

## 📝 Notes for Backend Team

1. **Field Names**: Use `field` for internal column identifiers (snake_case) and `title` for display names
2. **Timestamps**: All datetime fields should be ISO 8601 format with timezone
3. **IDs**: Use UUIDs or nanoid for all entity IDs
4. **Soft Delete**: Consider soft delete for databases, tables, and records (for undo functionality)
5. **Audit Log**: Track all changes (who, what, when) for compliance
6. **Rate Limiting**: Implement rate limiting on all endpoints
7. **Validation**: Server-side validation for all inputs
8. **Error Handling**: Consistent error response format with proper HTTP status codes

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'name' is required",
    "details": {
      "field": "name",
      "constraint": "required"
    }
  }
}
```

---

## 🤝 Questions for Backend Team

1. What's the preferred authentication method? (JWT, OAuth, Session)
2. File upload size limits and storage solution?
3. WebSocket implementation preference? (Socket.io, native WebSocket)
4. Database choice and data modeling approach?
5. Caching strategy? (Redis, in-memory)
6. Rate limiting rules?
7. Expected response times for different operations?

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Contact**: Frontend Team

