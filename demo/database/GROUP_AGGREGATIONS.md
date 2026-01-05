# Group Aggregations in 2-Level Grouping

## Overview

Display calculated values (sum, average, min, max, count) for number fields in grouped table headers. Aggregations appear in the secondary group rows (Level 2) showing totals and statistics for each group.

## Supported Aggregation Types

| Type | Symbol | Description | Use Case |
|------|--------|-------------|----------|
| **sum** | `Σ` | Sum of all values | Total Amount, Total Quantity |
| **avg** | `⌀` | Average of values | Average Price, Average Rating |
| **min** | `Min` | Minimum value | Lowest Price, Earliest Date |
| **max** | `Max` | Maximum value | Highest Price, Latest Date |
| **count** | `#` | Count of records | Number of Items |

## Supported Field Types

Aggregations work on:
- ✅ **number** fields (price, quantity, etc.)
- ✅ **rollup** fields (calculated aggregations)
- ✅ **fx** fields (formula results)

## Visual Example

```
▼ Alice Chen (6 quotations)
  ├─ ▼ Sent (3)          Σ $156,700.00    ← Level 2: Sub-total per status
  │   ├─ QT-2024-001     $126,000.00
  │   ├─ QT-2024-004     $10,500.00
  │   └─ QT-2024-015     $48,510.00
  │
  ├─ ▼ Draft (2)         Σ $68,512.50
  │   ├─ QT-2024-005     $56,700.00
  │   └─ QT-2024-003     $11,812.50
  │
  ├─ ▼ Accepted (1)      Σ $11,812.50
  │   └─ QT-2024-006     $11,812.50
  │
  └─ Total               Σ $236,725.00    ← Level 1: Grand total for Alice
  
▼ Bob Smith (4 quotations)
  ├─ ▼ Sent (2)          Σ $89,250.00
  │   ├─ QT-2024-007     $45,000.00
  │   └─ QT-2024-010     $44,250.00
  │
  ├─ ▼ Draft (2)         Σ $72,450.00
  │   ├─ QT-2024-008     $34,200.00
  │   └─ QT-2024-009     $38,250.00
  │
  └─ Total               Σ $161,700.00    ← Level 1: Grand total for Bob
```

## How to Configure

### Method 1: In View Config (Code)

```typescript
{
  groupBy: {
    field: "salesPerson",           // Level 1: Group by Sales Person
    secondaryField: "status",        // Level 2: Group by Status
    aggregations: [
      {
        field: "totalAmount",        // Which field to aggregate
        type: "sum"                  // Aggregation type
      }
    ]
  }
}
```

### Method 2: Multiple Aggregations

```typescript
aggregations: [
  { field: "totalAmount", type: "sum" },    // Total $
  { field: "quantity", type: "sum" },       // Total Qty
  { field: "discount", type: "avg" }        // Avg Discount %
]
```

## Example Configurations

### Example 1: Sales Pipeline with Totals

**View**: Quotations grouped by Sales Person → Status  
**Aggregation**: Sum of Total Amount

Shows each salesperson's pipeline with total value per status.

```json
{
  "groupBy": {
    "field": "salesPerson",
    "secondaryField": "status",
    "aggregations": [
      { "field": "totalAmount", "type": "sum" }
    ]
  }
}
```

### Example 2: Company Analysis

**View**: Quotations grouped by Company → Status  
**Aggregations**: 
- Sum of Total Amount
- Count of Quotations
- Average Amount

```json
{
  "groupBy": {
    "field": "company",
    "secondaryField": "status",
    "aggregations": [
      { "field": "totalAmount", "type": "sum" },
      { "field": "totalAmount", "type": "avg" },
      { "field": "id", "type": "count" }
    ]
  }
}
```

### Example 3: Product Analysis

**View**: Quotation Lines grouped by Product → Discount Level  
**Aggregations**:
- Sum of Quantity
- Average Unit Price
- Min/Max Discount

```json
{
  "groupBy": {
    "field": "product",
    "secondaryField": "discountTier",
    "aggregations": [
      { "field": "quantity", "type": "sum" },
      { "field": "unitPrice", "type": "avg" },
      { "field": "discount", "type": "min" },
      { "field": "discount", "type": "max" }
    ]
  }
}
```

## Display Format

### Aggregation Badge

Aggregated values appear in a styled badge:

```
┌─────────────────┐
│ Σ $156,700.00   │  ← Sum of Total Amount
└─────────────────┘
  ↑   ↑
  │   └─ Formatted number (respects column formatting)
  └─ Aggregation symbol
```

### Styling
- **Color**: Primary color with light background
- **Position**: In the group node row, under the aggregated column
- **Format**: Respects the column's number formatting (currency, decimals, etc.)

## Implementation Details

### Calculation

```typescript
// For each group of rows, calculate:
function calculateAggregation(rows, field, type) {
  switch (type) {
    case 'sum':
      return rows.reduce((sum, row) => sum + row[field], 0)
    case 'avg':
      return rows.reduce((sum, row) => sum + row[field], 0) / rows.length
    case 'min':
      return Math.min(...rows.map(row => row[field]))
    case 'max':
      return Math.max(...rows.map(row => row[field]))
    case 'count':
      return rows.length
  }
}
```

### Display Logic

1. **Group Node Creation**: When creating secondary group nodes, calculate aggregations
2. **Store Results**: Add aggregation results to `_agg_{fieldName}` property
3. **Render**: Display aggregated values in group row cells with special formatting

## Demo View

The **"High Value Deals"** view is pre-configured with aggregations:
- Navigate to: `CRM Database > Quotations > High Value Deals`
- Grouped by: Sales Person → Status
- Shows: Sum of Total Amount per status group

## Benefits

✅ **Quick Insights**: See totals and averages at a glance  
✅ **Business Intelligence**: Understand group-level metrics  
✅ **Performance Tracking**: Compare totals across salespeople, statuses, etc.  
✅ **Multi-metric**: Show multiple aggregations side-by-side  
✅ **Formatted Output**: Respects currency, decimal, and number formatting

## Use Cases

### Sales & CRM
- Total deal value per salesperson/status
- Average deal size by company
- Count of quotations per month

### Finance
- Sum of invoices by customer
- Average payment amount by status
- Total revenue by product category

### Operations
- Total quantity by product
- Average processing time by status
- Count of orders by region

### Analytics
- Min/max values to identify outliers
- Average ratings by product
- Count of records for volume analysis

## Two-Level Aggregations

### Level 1: Primary Group Footer
- Shows **grand total** for the entire primary group
- Displayed in the **footer row** at the bottom of each table
- Calculates across all records in the group (regardless of secondary grouping)
- Styled with bold text and border separator

### Level 2: Secondary Group Headers
- Shows **sub-totals** for each secondary group
- Displayed in the **group header row** within the tree structure
- Calculates only for records within that specific sub-group
- Styled as colored badges next to group labels

### Example:
```
Sales Person: Alice Chen
  ├─ Status: Sent       → Sub-total: Σ $156,700.00 (Level 2)
  ├─ Status: Draft      → Sub-total: Σ $68,512.50  (Level 2)
  └─ Status: Accepted   → Sub-total: Σ $11,812.50  (Level 2)
  
  Footer: Total         → Grand total: Σ $236,725.00 (Level 1)
```

## Limitations

1. **Number Fields**: Only works with number, rollup, and fx fields
2. **Simple Calculations**: No nested aggregations or complex formulas
3. **Client-Side**: Calculated on frontend (suitable for <10k records)

## Future Enhancements

- [ ] Aggregations in Level 1 group headers
- [ ] Custom aggregation formulas
- [ ] Conditional aggregations (e.g., sum only if status = 'Active')
- [ ] Grand totals across all groups
- [ ] Percentage calculations (% of total)
- [ ] Backend aggregation for large datasets

---

**Feature Added**: December 18, 2025  
**Status**: ✅ Ready for Testing  
**Example View**: High Value Deals (Quotations table)

