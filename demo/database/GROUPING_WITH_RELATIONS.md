# Grouping with Relation Fields

## New Feature: Group by Related Fields

The 2-level grouping now supports **relation fields** in addition to single-select, user, checkbox, and switch fields.

## What This Enables

You can now group records by:
- **Direct fields**: Status, Assigned User, Active/Inactive, etc.
- **Related fields**: Company, Contact Person, Related Records, etc.

## Example Use Cases

### 1. Group Quotations by Company (Relation Field)

**Primary Group By**: `Company` (relation field)  
**Secondary Group By**: `Status` (single-select field)

**Result:**
```
▼ TechCorp Solutions (4 quotations)
  ├─ ▼ Sent (2)
  ├─ ▼ Accepted (1)
  └─ ▼ Draft (1)

▼ Global Industries Ltd (4 quotations)
  ├─ ▼ Sent (2)
  ├─ ▼ Draft (1)
  └─ ▼ Accepted (1)
```

### 2. Group by Contact Person (Relation Field)

**Primary Group By**: `Contact Person` (relation field)  
**Secondary Group By**: `Company` (relation field)

Shows which contact person has quotations, and which companies they represent.

### 3. Mixed Grouping Examples

| Primary | Secondary | Use Case |
|---------|-----------|----------|
| Company (relation) | Status | Company pipeline view |
| Contact Person (relation) | Status | Contact's active deals |
| Sales Person (user) | Company (relation) | Sales rep's accounts |
| Status | Company (relation) | Status-based company view |

## How It Works

### For Single Relations
When grouping by a relation field that links to a single record:
- Uses the related record's display field
- Example: Company name from company relation

### For Multiple Relations
When grouping by a relation field that links to multiple records:
- Uses the **first** related record only
- Groups records by their first relation
- Note: Records with multiple relations will only appear in one group

### Label Resolution
The group label shows the **display field** from the related table:
- Company relation → Shows company name
- Contact relation → Shows contact name
- Custom display field is respected

## Implementation Details

### Supported Field Types for Grouping

| Field Type | Primary Level | Secondary Level | Notes |
|------------|---------------|-----------------|-------|
| single-select | ✅ | ✅ | Shows option labels |
| user | ✅ | ✅ | Shows user names |
| checkbox | ✅ | ✅ | Shows ✓ Yes / ✗ No |
| switch | ✅ | ✅ | Shows ✓ Yes / ✗ No |
| **relation** | ✅ | ✅ | Shows related record display field |

### Technical Behavior

**For Multiple Relations:**
```typescript
// If relation field has multiple values: ["comp-1", "comp-2", "comp-3"]
// Only "comp-1" is used for grouping
// This prevents records appearing in multiple groups
```

**Empty Relations:**
```typescript
// If relation field is null/empty
// Record appears in "(Empty)" group
```

## Try It Out

### Example 1: View Quotations by Company
1. Go to **Quotations** table
2. Open **View Settings**
3. Set **Primary Group By**: `Company`
4. Set **Secondary Group By**: `Status`
5. Click **Save**

### Example 2: View by Contact Person
1. Go to **Quotations** table
2. Open **View Settings**
3. Set **Primary Group By**: `Contact Person`
4. Set **Secondary Group By**: `Company`
5. Click **Save**

## Benefits

✅ **Better Organization**: Group by what matters - companies, contacts, relationships  
✅ **Flexible Analysis**: Combine relation fields with other field types  
✅ **Business Context**: See data in business-relevant groupings (by customer, by partner, etc.)  
✅ **Multi-dimensional**: Any combination of supported field types

## Limitations

1. **Multiple Relations**: Only first relation is used for grouping
2. **Deep Relations**: Cannot group by fields from related tables (e.g., Company → Company Type)
3. **Circular Relations**: Avoid grouping tables that reference themselves

## Future Enhancements

- [ ] Group by multiple relations (show in all applicable groups)
- [ ] Group by related table fields (e.g., Company → Type)
- [ ] Custom grouping labels for relations
- [ ] Count of records per relation in group header

---

**Feature Added**: December 18, 2025  
**Status**: ✅ Ready for Testing  
**Related Docs**: 
- [2-Level Grouping](./TWO_LEVEL_GROUPING.md)
- [Group By Implementation](./GROUP_BY_IMPLEMENTATION.md)

