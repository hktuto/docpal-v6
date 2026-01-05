# Backend Handshake - Quick Reference

Quick guide for backend developers to implement the database management system API.

---

## 🚀 Quick Start Checklist

### Phase 1: MVP (2-3 weeks)
- [ ] Database CRUD endpoints
- [ ] Table CRUD endpoints
- [ ] Column CRUD endpoints
- [ ] Record CRUD endpoints with filtering/sorting/pagination
- [ ] Basic authentication & permissions
- [ ] File upload for attachments

### Phase 2: Enhanced (1-2 weeks)
- [ ] View management endpoints
- [ ] Advanced filtering (multiple conditions, operators)
- [ ] Bulk operations (bulk delete, bulk update)
- [ ] Row-level security
- [ ] Search functionality

### Phase 3: Advanced (2-3 weeks)
- [ ] Trigger/automation endpoints
- [ ] Dashboard data aggregation
- [ ] WebSocket for real-time updates
- [ ] Export functionality
- [ ] Workflow integration

---

## 📍 Essential Endpoints (Must Implement First)

### 1. Database Management
```
GET    /api/databases
POST   /api/databases
GET    /api/databases/:id
PATCH  /api/databases/:id
DELETE /api/databases/:id
```

### 2. Table Management
```
GET    /api/databases/:databaseId/tables
POST   /api/databases/:databaseId/tables
GET    /api/databases/:databaseId/tables/:tableId
PATCH  /api/databases/:databaseId/tables/:tableId
DELETE /api/databases/:databaseId/tables/:tableId
```

### 3. Column Management
```
GET    /api/databases/:databaseId/tables/:tableId/columns
POST   /api/databases/:databaseId/tables/:tableId/columns
PATCH  /api/databases/:databaseId/tables/:tableId/columns/:columnId
DELETE /api/databases/:databaseId/tables/:tableId/columns/:columnId
POST   /api/databases/:databaseId/tables/:tableId/columns/reorder
```

### 4. Record Management (Most Important!)
```
GET    /api/databases/:databaseId/tables/:tableId/records
       Query params: page, pageSize, sort, filter, search
POST   /api/databases/:databaseId/tables/:tableId/records
GET    /api/databases/:databaseId/tables/:tableId/records/:recordId
PATCH  /api/databases/:databaseId/tables/:tableId/records/:recordId
DELETE /api/databases/:databaseId/tables/:tableId/records/:recordId
POST   /api/databases/:databaseId/tables/:tableId/records/bulk-delete
POST   /api/databases/:databaseId/tables/:tableId/records/bulk-update
```

### 5. File Upload
```
POST   /api/files/upload
DELETE /api/files/:fileId
GET    /api/files/:fileId/download
```

---

## 🔑 Authentication & Authorization

### Authentication
```http
Authorization: Bearer <jwt_token>
```

### Permission Levels
1. **Database**: `owner`, `admin`, `editor`, `viewer`
2. **Table**: `manage`, `edit`, `create`, `view`
3. **Row-Level**: Filter records based on conditions

### Permission Check Logic
```
Request: GET /api/databases/123/tables/456/records
1. Check if user has access to database 123
2. Check if user has 'view' permission on table 456
3. Apply row-level security filters
4. Return filtered records
```

---

## 📊 Data Models (Quick Reference)

### Database
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "icon": "string",
  "color": "string",
  "createdAt": "ISO 8601",
  "createdBy": "userId",
  "updatedAt": "ISO 8601"
}
```

### Table
```json
{
  "id": "uuid",
  "databaseId": "uuid",
  "name": "string",
  "description": "string",
  "icon": "string",
  "tableType": "private|public",
  "columns": [...],
  "recordCount": "number",
  "createdAt": "ISO 8601"
}
```

### Column
```json
{
  "id": "uuid",
  "field": "internal_name",
  "title": "Display Name",
  "type": "text|number|date|single-select|relation|...",
  "required": "boolean",
  "unique": "boolean",
  "options": [...],  // For select types
  "relationConfig": {...},  // For relation type
  "order": "number"
}
```

### Record
```json
{
  "id": "uuid",
  "fields": {
    "field1": "value1",
    "field2": "value2",
    "field3": ["array", "values"]
  },
  "createdAt": "ISO 8601",
  "createdBy": "userId",
  "updatedAt": "ISO 8601",
  "updatedBy": "userId"
}
```

---

## 🔍 Filtering & Sorting Examples

### Filter Query Parameter
```json
// GET /api/databases/1/tables/2/records?filter=...
{
  "logic": "AND",
  "conditions": [
    {
      "field": "status",
      "operator": "equals",
      "value": "active"
    },
    {
      "field": "amount",
      "operator": "gt",
      "value": 1000
    }
  ]
}
```

### Supported Operators
- `equals` - Exact match
- `contains` - Text contains (case-insensitive)
- `gt` / `gte` - Greater than / or equal
- `lt` / `lte` - Less than / or equal
- `in` - Value in array
- `notIn` - Value not in array
- `isEmpty` - Field is null/empty
- `isNotEmpty` - Field has value

### Sort Query Parameter
```
GET /api/databases/1/tables/2/records?sort=name:asc,createdAt:desc
```

### Pagination
```
GET /api/databases/1/tables/2/records?page=1&pageSize=50
```

---

## 🎨 Column Types Implementation Guide

### Simple Types (Store as-is)
- `text` → VARCHAR/TEXT
- `number` → DECIMAL/NUMERIC
- `date` → DATE
- `datetime` → TIMESTAMP
- `checkbox` → BOOLEAN
- `email`, `url`, `phone` → VARCHAR with validation

### Complex Types

#### Single Select / Multi Select
```json
// Column definition
{
  "type": "single-select",
  "options": [
    { "id": "opt1", "label": "Active", "color": "#67C23A" },
    { "id": "opt2", "label": "Pending", "color": "#E6A23C" }
  ]
}

// Record value
{
  "fields": {
    "status": "opt1"  // Store option ID
  }
}
```

#### Relation
```json
// Column definition
{
  "type": "relation",
  "relationConfig": {
    "targetTableId": "table123",
    "relationType": "many-to-one",
    "inverseFieldId": "field456"
  }
}

// Record value
{
  "fields": {
    "assignee": "record789"  // Single relation
    "tags": ["record1", "record2"]  // Multiple relation
  }
}
```

#### Attachment
```json
// Column definition
{
  "type": "attachment",
  "config": {
    "maxFiles": 10,
    "allowedTypes": ["image/*", "application/pdf"]
  }
}

// Record value
{
  "fields": {
    "documents": [
      {
        "id": "file123",
        "name": "invoice.pdf",
        "url": "https://...",
        "size": 1024000,
        "type": "application/pdf"
      }
    ]
  }
}
```

#### Formula (Computed)
```json
// Column definition
{
  "type": "fx",
  "formulaConfig": {
    "expression": "{price} * {quantity}",
    "dependencies": ["price", "quantity"]
  }
}

// Backend: Calculate on read, don't store in database
```

#### Lookup
```json
// Column definition
{
  "type": "lookup",
  "lookupConfig": {
    "relationFieldId": "assignee",  // Which relation field
    "targetFieldId": "email"  // Which field to lookup
  }
}

// Backend: Join and fetch on read
```

#### Rollup (Aggregate)
```json
// Column definition
{
  "type": "rollup",
  "rollupConfig": {
    "relationFieldId": "tasks",
    "targetFieldId": "hours",
    "aggregation": "sum"  // sum, avg, count, min, max
  }
}

// Backend: Calculate aggregation on read
```

---

## 🔄 Real-time Updates (WebSocket)

### Events to Emit

#### Record Changes
```javascript
// When record is created
socket.emit('record.created', {
  tableId: 'table123',
  recordId: 'record456',
  fields: {...},
  userId: 'user789'
})

// When record is updated
socket.emit('record.updated', {
  tableId: 'table123',
  recordId: 'record456',
  fields: {...},  // Only changed fields
  userId: 'user789'
})

// When record is deleted
socket.emit('record.deleted', {
  tableId: 'table123',
  recordId: 'record456',
  userId: 'user789'
})
```

#### Collaboration
```javascript
// When user joins
socket.emit('user.joined', {
  userId: 'user123',
  name: 'John Doe',
  avatar: 'url',
  databaseId: 'db456'
})

// When user leaves
socket.emit('user.left', {
  userId: 'user123',
  databaseId: 'db456'
})
```

### Room Structure
```javascript
// Users join rooms based on what they're viewing
socket.join('database:123')  // All users viewing database 123
socket.join('table:456')  // All users viewing table 456
```

---

## 🚨 Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      // Additional context
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - No permission
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Duplicate/conflict
- `INTERNAL_ERROR` (500) - Server error

### Example Errors
```json
// Validation error
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

// Permission error
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have 'edit' permission on this table",
    "details": {
      "requiredPermission": "edit",
      "currentPermission": "view"
    }
  }
}
```

---

## 🧪 Testing Checklist

### For Each Endpoint
- [ ] Success case (200/201)
- [ ] Validation errors (400)
- [ ] Authentication (401)
- [ ] Permission denied (403)
- [ ] Not found (404)
- [ ] Large datasets (pagination)
- [ ] Empty datasets
- [ ] Concurrent requests

### Performance Targets
- Simple GET: < 100ms
- GET with filters: < 300ms
- POST/PATCH: < 200ms
- Bulk operations: < 1s for 100 items
- File upload: < 5s for 10MB

---

## 💡 Implementation Tips

### 1. Dynamic Schema Challenge
Tables have dynamic columns. Consider:
- **Option A**: Store records as JSONB (PostgreSQL)
- **Option B**: EAV (Entity-Attribute-Value) pattern
- **Option C**: Create actual database columns dynamically

**Recommendation**: JSONB for flexibility

### 2. Filtering Implementation
```sql
-- Example: Filter records where status='active' AND amount > 1000
SELECT * FROM records
WHERE table_id = '123'
  AND data->>'status' = 'active'
  AND (data->>'amount')::numeric > 1000
```

### 3. Computed Fields (Formula, Lookup, Rollup)
- Don't store in database
- Calculate on read
- Cache if performance issue
- Return in same format as regular fields

### 4. Permissions Check
```javascript
// Middleware example
async function checkTablePermission(req, res, next) {
  const { databaseId, tableId } = req.params
  const userId = req.user.id
  
  const hasAccess = await checkUserTableAccess(userId, tableId, 'view')
  if (!hasAccess) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'No access to this table'
      }
    })
  }
  
  next()
}
```

### 5. Row-Level Security
```javascript
// Apply RLS filters to record query
async function getRecords(tableId, userId, filters) {
  const rlsConditions = await getRLSConditions(tableId, userId)
  
  // Combine user filters with RLS filters
  const combinedFilters = {
    logic: 'AND',
    conditions: [
      ...filters.conditions,
      ...rlsConditions
    ]
  }
  
  return queryRecords(tableId, combinedFilters)
}
```

---

## 📦 Example Response Structures

### GET /api/databases
```json
{
  "data": [
    {
      "id": "db1",
      "name": "Sales CRM",
      "icon": "💼",
      "color": "#409EFF",
      "tableCount": 5,
      "recordCount": 1234,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 50
}
```

### GET /api/databases/:databaseId/tables/:tableId/records
```json
{
  "data": [
    {
      "id": "rec1",
      "fields": {
        "name": "John Doe",
        "email": "john@example.com",
        "status": "opt_active",
        "amount": 5000,
        "assignee": "user123",
        "tags": ["tag1", "tag2"],
        "created_at": "2024-01-15T10:30:00Z"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": "user456",
      "updatedAt": "2024-01-16T14:20:00Z",
      "updatedBy": "user789"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 50,
  "hasMore": true
}
```

---

## 🔐 Security Considerations

1. **SQL Injection**: Use parameterized queries
2. **XSS**: Sanitize user input (especially in formula fields)
3. **File Upload**: Validate file types, scan for malware
4. **Rate Limiting**: Prevent API abuse
5. **CORS**: Configure allowed origins
6. **Audit Log**: Track all changes for compliance

---

## 📞 Communication Channels

### For Questions
- **Slack**: #backend-frontend-handshake
- **Email**: frontend-team@company.com
- **Meetings**: Daily standup at 10am

### For Issues
- **JIRA**: Use label `api-integration`
- **GitHub**: Create issue in backend repo

### Response Time Expectations
- Blocking issues: < 2 hours
- Regular questions: < 24 hours
- Feature requests: < 72 hours

---

## 📈 Monitoring & Metrics

Please implement:
1. **API Response Times**: Track P50, P95, P99
2. **Error Rates**: Track 4xx and 5xx errors
3. **Throughput**: Requests per second
4. **WebSocket Connections**: Active connections count
5. **Database Queries**: Slow query log

Dashboard: `https://monitoring.company.com/database-api`

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- [ ] Frontend can list databases
- [ ] Frontend can view table data
- [ ] Frontend can create/edit/delete records
- [ ] Frontend can filter and sort records
- [ ] File attachments work
- [ ] All MVP endpoints return < 500ms

### Phase 2 Complete When:
- [ ] All view types work (Table, Kanban, Gallery, Calendar, Gantt)
- [ ] Advanced filtering with multiple conditions works
- [ ] Permissions properly restrict access
- [ ] Row-level security filters records

### Phase 3 Complete When:
- [ ] Triggers execute on events
- [ ] Real-time updates work via WebSocket
- [ ] Dashboard shows aggregated data
- [ ] Export functionality works

---

## 📚 Additional Resources

- **API Requirements**: See `API_REQUIREMENTS.md`
- **Page Mapping**: See `PAGE_API_MAPPING.md`
- **Frontend Code**: `demo/database/components/`
- **Type Definitions**: `demo/database/types/database.ts`

---

## ✅ Next Steps

1. **Backend Team**: Review these documents
2. **Joint Meeting**: Discuss any unclear requirements
3. **API Contract**: Finalize endpoint specifications
4. **Mock Server**: Set up for frontend development
5. **Implementation**: Start with Phase 1 endpoints
6. **Integration Testing**: Test together after each phase

---

**Ready to Start?** Let's schedule a kickoff meeting! 🚀

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Approved By**: Frontend Lead, Backend Lead

