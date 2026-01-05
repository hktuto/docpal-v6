# Aggregation Visual Guide

## What You'll See

When you enable aggregations in a 2-level grouped table, calculated values appear in **two locations**:
1. **Level 2 (Secondary Groups)**: Aggregations in group header rows (sub-totals)
2. **Level 1 (Primary Groups)**: Aggregations in table footer row (grand total)

## Example: Sales Pipeline View

### Configuration:
- **Primary Group (Level 1)**: Sales Person → Creates separate table sections
- **Secondary Group (Level 2)**: Status → Groups rows within each table
- **Aggregation**: Sum of Total Amount

### Visual Result:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 👤 Alice Chen (6 quotations)                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ▼ Sent (3)                    │ Σ $156,700.00 │  ← Level 2 Badge  │
│   ├─ QT-2024-001  Acme Corp   │ $126,000.00   │ 2024-01-15        │
│   ├─ QT-2024-004  TechStart   │ $10,500.00    │ 2024-02-01        │
│   └─ QT-2024-015  DataFlow    │ $48,510.00    │ 2024-03-10        │
│                                                                      │
│ ▼ Draft (2)                   │ Σ $68,512.50  │  ← Level 2 Badge  │
│   ├─ QT-2024-005  CloudNet    │ $56,700.00    │ 2024-02-05        │
│   └─ QT-2024-003  StartupXYZ  │ $11,812.50    │ 2024-01-20        │
│                                                                      │
│ ▼ Accepted (1)                │ Σ $11,812.50  │  ← Level 2 Badge  │
│   └─ QT-2024-006  MegaCorp    │ $11,812.50    │ 2024-02-10        │
│                                                                      │
├═════════════════════════════════════════════════════════════════════┤
│ Total                         │ Σ $236,725.00 │  ← Level 1 Footer │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 👤 Bob Smith (4 quotations)                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ▼ Sent (2)                    │ Σ $89,250.00  │                    │
│   ├─ QT-2024-007  RetailCo    │ $45,000.00    │ 2024-02-15        │
│   └─ QT-2024-010  ServiceInc  │ $44,250.00    │ 2024-03-01        │
│                                                                      │
│ ▼ Draft (2)                   │ Σ $72,450.00  │                    │
│   ├─ QT-2024-008  GlobalTech  │ $34,200.00    │ 2024-02-20        │
│   └─ QT-2024-009  LocalBiz    │ $38,250.00    │ 2024-02-25        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Level 1 vs Level 2 Aggregations

### Level 1: Primary Group Footer (Grand Total)

**Location**: Footer row at the bottom of each primary group table  
**Shows**: Grand total across **all** records in the primary group  
**When**: Always visible when aggregations are configured  
**Styling**: Bold text with prominent border separator

**Example**: 
- Alice Chen's table footer shows **Σ $236,725.00** (sum of all 6 quotations)
- Bob Smith's table footer shows **Σ $161,700.00** (sum of all 4 quotations)

### Level 2: Secondary Group Headers (Sub-Totals)

**Location**: Group header rows within the tree structure  
**Shows**: Sub-total for **only** records within that secondary group  
**When**: Only visible when secondary grouping is enabled  
**Styling**: Colored badges next to group labels

**Example**:
- "Sent" status group shows **Σ $156,700.00** (sum of 3 quotations with Sent status)
- "Draft" status group shows **Σ $68,512.50** (sum of 2 quotations with Draft status)

### Visual Comparison:

```
Primary Group: Alice Chen
  │
  ├─ Secondary: Sent      → Σ $156,700.00  (Level 2: Badge)
  ├─ Secondary: Draft     → Σ $68,512.50   (Level 2: Badge)  
  ├─ Secondary: Accepted  → Σ $11,812.50   (Level 2: Badge)
  │
  └─ Footer: Total        → Σ $236,725.00  (Level 1: Footer)
                             ══════════════
                             Sum of all Level 2 totals
```

## Aggregation Badge Styling (Level 2)

The aggregation values appear as **colored badges** in the group header row:

```
┌──────────────────┐
│ Σ $156,700.00    │  ← Aggregation Badge
└──────────────────┘
  ↑   ↑
  │   └─ Formatted value (respects column settings)
  └─ Symbol (Σ for sum)
```

### Badge Appearance:
- **Background**: Light primary color (subtle highlight)
- **Text**: Primary color (stands out)
- **Font Weight**: Bold (600)
- **Padding**: Compact (2px 8px)
- **Border Radius**: Small rounded corners

## Multiple Aggregations Example

You can add multiple aggregations to show different calculations side-by-side:

### Configuration:
- Aggregation 1: Sum of Total Amount
- Aggregation 2: Average of Total Amount
- Aggregation 3: Count of Records

### Visual Result:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▼ Sent (3)    │ Σ $156,700.00 │ ⌀ $52,233.33 │ # 3 │                      │
│   ├─ QT-001   │ $126,000.00   │              │     │                      │
│   ├─ QT-004   │ $10,500.00    │              │     │                      │
│   └─ QT-015   │ $48,510.00    │              │     │                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Aggregation Symbols

| Symbol | Type | Meaning |
|--------|------|---------|
| **Σ** | Sum | Total of all values |
| **⌀** | Average | Mean value |
| **Min** | Minimum | Smallest value |
| **Max** | Maximum | Largest value |
| **#** | Count | Number of records |

## Number Formatting

Aggregated values respect the column's display configuration:

### Currency Format:
```
Σ $156,700.00    ← Shows currency symbol and 2 decimals
```

### Percentage Format:
```
⌀ 15.5%          ← Shows percentage symbol
```

### Compact Format:
```
Σ 1.2M           ← Shows compact notation for large numbers
```

### Plain Format:
```
Σ 156,700.00     ← Shows plain number with decimals
```

## Configuration UI

### In View Settings Drawer:

```
┌─────────────────────────────────────────────────┐
│ View Settings                                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ Primary Group By (Level 1)                      │
│ [Sales Person ▼]                                │
│                                                  │
│ Secondary Group By (Level 2)                    │
│ [Status ▼]                                      │
│                                                  │
│ ─────────────────────────────────────────────   │
│                                                  │
│ Aggregations (Optional)                         │
│ Calculate totals, averages, etc. for number...  │
│                                                  │
│ [Total Amount ▼] [Σ Sum ▼] [🗑️]                │
│                                                  │
│ [+ Add Aggregation]                             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Aggregation Row Controls:

1. **Field Dropdown**: Select which number field to aggregate
   - Shows: number, rollup, and fx fields
   - Example: Total Amount, Quantity, Discount, etc.

2. **Type Dropdown**: Select aggregation type
   - Options:
     - Σ Sum
     - ⌀ Average
     - Min
     - Max
     - # Count

3. **Delete Button**: Remove this aggregation

## Empty States

### No Number Fields:
```
┌─────────────────────────────────────────────────┐
│ Aggregations (Optional)                         │
│ Calculate totals, averages, etc. for number...  │
│                                                  │
│ ⚠️ No number fields available for aggregation.  │
└─────────────────────────────────────────────────┘
```

### No Secondary Grouping:
The aggregations section only appears when you have both:
- ✅ Primary Group By selected
- ✅ Secondary Group By selected

## Real-World Use Cases

### 1. Sales Pipeline Analysis
**View**: Quotations by Sales Person → Status  
**Show**: Sum of Total Amount per status

**Insight**: See how much value each salesperson has in each pipeline stage

### 2. Product Performance
**View**: Orders by Product → Month  
**Show**: Sum of Quantity, Average of Unit Price

**Insight**: Track product sales volume and pricing trends over time

### 3. Customer Analysis
**View**: Orders by Customer → Status  
**Show**: Count of Orders, Sum of Total Amount

**Insight**: Identify high-value customers and order patterns

### 4. Discount Analysis
**View**: Quotation Lines by Product → Discount Tier  
**Show**: Average of Discount, Count of Lines

**Insight**: Understand discount distribution across products

### 5. Team Performance
**View**: Tasks by Assignee → Priority  
**Show**: Count of Tasks, Average of Estimated Hours

**Insight**: See workload distribution and time estimates

## Tips for Best Results

### ✅ DO:
- Use sum for totals (revenue, quantity, hours)
- Use average for rates (price, discount, rating)
- Use count for volume metrics (number of orders, tasks)
- Use min/max to identify outliers (highest/lowest values)
- Add multiple aggregations for comprehensive insights

### ❌ DON'T:
- Don't aggregate text fields (not supported)
- Don't expect aggregations without secondary grouping
- Don't use for very large datasets (>10k records) - may be slow
- Don't forget to save the view after configuring

## Keyboard Shortcuts

When configuring aggregations:
- **Tab**: Move between field and type dropdowns
- **Enter**: Open dropdown
- **Arrow Keys**: Navigate dropdown options
- **Escape**: Close dropdown
- **Delete/Backspace**: Focus on delete button

---

**Feature**: Group Aggregations  
**Version**: 1.0  
**Date**: December 18, 2025  
**Status**: ✅ Ready to Use

