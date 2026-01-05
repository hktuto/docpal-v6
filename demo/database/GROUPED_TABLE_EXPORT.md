# Grouped Table Excel Export Options

## Overview

When exporting a grouped table view to Excel, users can choose from **4 different formats** based on their needs. A dialog appears when clicking "Export Excel" in a grouped view, allowing format selection.

## Export Formats

### 1. 📊 Hierarchical with Aggregations (Recommended)

**Best for:** Presentations, reports, visual analysis

**Structure:**
```excel
┌───────────────────────────────────────────────────┐
│ Quotation # │ Company │ Status │ Total Amount    │ ← Headers (Bold, Gray)
├═══════════════════════════════════════════════════┤
│ 👤 Alice Chen (6 quotations)                     │ ← L1 Group (Bold, Blue)
├───────────────────────────────────────────────────┤
│   📊 Sent (3)                                     │ ← L2 Group (Bold, Light Gray)
│     QT-2024-001 │ Acme    │ Sent │ $126,000.00   │ ← Data (Normal)
│     QT-2024-004 │ TechSt  │ Sent │ $10,500.00    │
│     QT-2024-015 │ DataF   │ Sent │ $48,510.00    │
│     Subtotal                     │ Σ $156,700.00  │ ← L2 Agg (Bold, Italic)
├───────────────────────────────────────────────────┤
│   📊 Draft (2)                                    │
│     QT-2024-005 │ CloudN  │ Draft│ $56,700.00    │
│     QT-2024-003 │ StartX  │ Draft│ $11,812.50    │
│     Subtotal                     │ Σ $68,512.50   │
├───────────────────────────────────────────────────┤
│   📊 Accepted (1)                                 │
│     QT-2024-006 │ MegaC   │ Acc  │ $11,812.50    │
│     Subtotal                     │ Σ $11,812.50   │
├═══════════════════════════════════════════════════┤
│   Total                          │ Σ $236,725.00  │ ← L1 Agg (Bold, Colored)
└───────────────────────────────────────────────────┘
```

**Features:**
- ✅ Preserves exact view structure
- ✅ Color-coded group levels
- ✅ Includes both L1 (total) and L2 (subtotal) aggregations
- ✅ Uses Excel outline levels for collapse/expand
- ✅ Professional formatting with borders and fills
- ✅ Single file, easy to share

**File name:** `{TableName}_hierarchical_{Date}.xlsx`

---

### 2. 📑 Separate Sheets per Group

**Best for:** Distributing to team members, isolated analysis

**Structure:**
```excel
📁 Workbook
  ├─ 📄 Sheet: "Alice Chen"
  │   ┌─────────────────────────────────┐
  │   │ Quotation # │ Company │ Amount  │
  │   ├─────────────────────────────────┤
  │   │ QT-2024-001 │ Acme    │ $126K   │
  │   │ QT-2024-004 │ TechSt  │ $10.5K  │
  │   │ ...                             │
  │   ├─────────────────────────────────┤
  │   │ Total                 │ $236K   │ ← Each sheet has its own total
  │   └─────────────────────────────────┘
  │
  ├─ 📄 Sheet: "Bob Smith"
  │   ┌─────────────────────────────────┐
  │   │ Quotation # │ Company │ Amount  │
  │   │ ...                             │
  │   └─────────────────────────────────┘
  │
  └─ 📄 Sheet: "Carol White"
      └─ ...
```

**Features:**
- ✅ Each primary group = separate worksheet
- ✅ Sheet name = group label (e.g., salesperson name)
- ✅ Self-contained with totals
- ✅ Easy to distribute (send specific sheets to specific people)
- ✅ Clean separation by group
- ❌ Harder to compare across groups

**File name:** `{TableName}_by_groups_{Date}.xlsx`

---

### 3. 📋 Flat Format with Group Columns

**Best for:** Data analysis, pivot tables, importing to other tools

**Structure:**
```excel
┌────────────┬────────────┬──────────────┬──────────┬────────┐
│ Sales      │ Status     │ Quotation #  │ Company  │ Amount │ ← Added group cols
├────────────┼────────────┼──────────────┼──────────┼────────┤
│ Alice Chen │ Sent       │ QT-2024-001  │ Acme     │ $126K  │
│ Alice Chen │ Sent       │ QT-2024-004  │ TechSt   │ $10.5K │
│ Alice Chen │ Draft      │ QT-2024-005  │ CloudN   │ $56.7K │
│ Alice Chen │ Accepted   │ QT-2024-006  │ MegaC    │ $11.8K │
│ Bob Smith  │ Sent       │ QT-2024-007  │ RetailC  │ $45K   │
│ Bob Smith  │ Draft      │ QT-2024-008  │ GlobalT  │ $34.2K │
└────────────┴────────────┴──────────────┴──────────┴────────┘
```

**Features:**
- ✅ Simple flat table format
- ✅ Group values as regular columns
- ✅ Easy to import into other systems
- ✅ Perfect for creating Excel pivot tables
- ✅ Compatible with data analysis tools
- ❌ No visual hierarchy
- ❌ No aggregations included

**Use cases:**
- Import into Power BI / Tableau
- Create custom pivot tables
- Data analysis in R / Python
- Import into other databases

**File name:** `{TableName}_flat_{Date}.xlsx`

---

### 4. 📈 Summary + Detail Sheets

**Best for:** Executive reports, high-level + drill-down analysis

**Structure:**
```excel
📁 Workbook

├─ 📄 Sheet 1: "Summary"
│   ┌──────────────┬──────────┬─────────┬───────┐
│   │ Sales Person │ Total $  │ Avg $   │ Count │ ← Aggregations only
│   ├──────────────┼──────────┼─────────┼───────┤
│   │ Alice Chen   │ $236,725 │ $39,454 │ 6     │
│   │ Bob Smith    │ $161,700 │ $40,425 │ 4     │
│   │ Carol White  │ $98,500  │ $32,833 │ 3     │
│   ├──────────────┼──────────┼─────────┼───────┤
│   │ Grand Total  │ $496,925 │ $38,225 │ 13    │
│   └──────────────┴──────────┴─────────┴───────┘
│
└─ 📄 Sheet 2: "Details"
    ┌────────────┬──────────────┬──────────┬────────┐
    │ Sales      │ Quotation #  │ Company  │ Amount │ ← All data
    ├────────────┼──────────────┼──────────┼────────┤
    │ Alice Chen │ QT-2024-001  │ Acme     │ $126K  │
    │ Alice Chen │ QT-2024-004  │ TechSt   │ $10.5K │
    │ Alice Chen │ QT-2024-005  │ CloudN   │ $56.7K │
    │ ...                                          │
    └────────────┴──────────────┴──────────┴────────┘
```

**Features:**
- ✅ Best of both worlds
- ✅ Summary sheet for quick insights
- ✅ Details sheet for drill-down
- ✅ Clean separation of views
- ✅ Perfect for executive presentations
- ✅ Shows all configured aggregations in summary

**File name:** `{TableName}_summary_detail_{Date}.xlsx`

---

## How to Use

### Step 1: Click Export Button
In any grouped table view, click the **"Export Excel"** button in the toolbar.

### Step 2: Choose Format
A dialog appears with 4 format options. Each option shows:
- **Icon & Title**: Format name
- **Description**: What it's best for
- **Preview**: Structure example

### Step 3: Export
Click **"Export"** to download the Excel file.

## Format Comparison

| Feature | Hierarchical | Separate Sheets | Flat | Summary+Detail |
|---------|-------------|----------------|------|----------------|
| Visual Hierarchy | ✅ | ❌ | ❌ | Partial |
| L1 Aggregations | ✅ | ✅ | ❌ | ✅ |
| L2 Aggregations | ✅ | ❌ | ❌ | ❌ |
| Multiple Sheets | ❌ | ✅ | ❌ | ✅ |
| Pivot-ready | ❌ | ❌ | ✅ | ✅ |
| Quick Summary | ❌ | ❌ | ❌ | ✅ |
| File Size | Medium | Large | Small | Medium |
| Best For | Presentations | Distribution | Analysis | Reports |

## Technical Details

### Excel Styling

**Hierarchical Format:**
- Primary group headers: Blue background (`#D0E4F7`), bold, size 11
- Secondary group headers: Light gray background (`#F0F0F0`), bold
- Data rows: Normal formatting, outline level 2
- Subtotal rows: Bold italic
- Total rows: Blue text (`#0066CC`), light blue background (`#E6F2FF`), bold
- Excel outline levels: Groups are collapsible

**Separate Sheets:**
- Sheet names: Truncated to 31 chars (Excel limit)
- Header row: Gray background (`#E0E0E0`), bold, size 12
- Total row: Yellow background (`#FFEB9C`), bold

**Flat Format:**
- Simple table with headers
- No special formatting
- Group columns added at the start

**Summary+Detail:**
- Summary: Clean table with grand total row
- Details: Flat format with group column

### Column Widths
All formats auto-set column widths to 20 characters for readability.

### Number Formatting
- Respects column display configuration
- Currency symbols preserved
- Decimal places maintained
- Special formats (accounting, compact) converted to standard Excel formats

### Data Handling

**Rollup Fields:**
Calculated on-the-fly during export using `calculateRollupValue()`.

**Related Fields:**
Resolved to display values (not IDs).

**User Fields:**
Converted to user names.

**Single-select Fields:**
Converted to option labels.

**Empty Values:**
Displayed as "-".

## Use Case Examples

### Sales Pipeline Review (Hierarchical)
**Scenario:** Weekly sales meeting, review each salesperson's pipeline  
**Format:** Hierarchical  
**Why:** Visual hierarchy shows status breakdown, both subtotals and totals visible

### Month-end Distribution (Separate Sheets)
**Scenario:** Send each salesperson their monthly summary  
**Format:** Separate Sheets  
**Why:** Each person gets their own sheet, self-contained with totals

### Quarterly Analysis (Flat)
**Scenario:** Create pivot table to analyze trends  
**Format:** Flat  
**Why:** Pivot-ready format, easy to slice and dice

### Executive Dashboard (Summary+Detail)
**Scenario:** Board presentation with high-level metrics  
**Format:** Summary+Detail  
**Why:** Summary for presentation, details for Q&A

## Non-Grouped Tables

For tables **without grouping**, clicking "Export Excel" exports directly (no dialog) using VxeTable's default export.

**Format:** Simple flat table with all visible columns  
**Filename:** `{TableName}_{Date}.xlsx`

## Library Used

**ExcelJS** (v4.4.0)
- Professional Excel file generation
- Supports advanced styling (colors, fonts, borders)
- Client-side generation (no server required)
- Supports large datasets

## Limitations

1. **Excel Sheet Names:** Limited to 31 characters (Separate Sheets format)
2. **Client-Side:** Generated in browser (may be slow for >10k records)
3. **Formatting:** Some advanced column formats simplified for Excel compatibility
4. **Images/Attachments:** Not exported, only text/number data

## Future Enhancements

- [ ] Export progress indicator for large datasets
- [ ] Custom column selection before export
- [ ] Additional formats (CSV, PDF)
- [ ] Scheduled exports
- [ ] Email export directly
- [ ] Template-based exports
- [ ] Chart generation in exports

---

**Feature:** Multiple Excel Export Formats  
**Implementation Date:** December 18, 2025  
**Status:** ✅ Complete and Ready to Use  
**Dependencies:** ExcelJS (4.4.0)

