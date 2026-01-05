# Demo Data Summary - 2-Level Grouping

## Overview

Added 14 new quotations (QT-2024-004 to QT-2024-017) with their quotation lines to demonstrate the 2-level grouping feature effectively.

**Total Quotations**: 17  
**Total Quotation Lines**: 24

## Distribution for 2-Level Grouping

### Primary Level: Group by Sales Person

#### 1. Alice Chen (user-1) - 6 quotations
- **TechCorp Solutions** (2 quotations)
  - QT-2024-001 (Accepted)
  - QT-2024-004 (Sent)
  
- **Global Industries Ltd** (2 quotations)
  - QT-2024-005 (Draft)
  - QT-2024-015 (Sent)
  
- **StartupXYZ** (2 quotations)
  - QT-2024-003 (Draft)
  - QT-2024-006 (Accepted)

#### 2. Bob Wilson (user-2) - 5 quotations
- **TechCorp Solutions** (1 quotation)
  - QT-2024-007 (Sent)
  
- **Global Industries Ltd** (1 quotation)
  - QT-2024-002 (Sent)
  
- **MegaRetail Corp** (2 quotations)
  - QT-2024-008 (Draft)
  - QT-2024-016 (Accepted)
  
- **City Government Office** (1 quotation)
  - QT-2024-009 (Sent)

#### 3. Carol Davis (user-3) - 4 quotations
- **StartupXYZ** (2 quotations)
  - QT-2024-011 (Draft)
  - QT-2024-017 (Expired)
  
- **Global Industries Ltd** (1 quotation)
  - QT-2024-010 (Accepted)
  
- **MegaRetail Corp** (1 quotation)
  - QT-2024-012 (Draft)

#### 4. David Lee (user-4) - 3 quotations
- **TechCorp Solutions** (1 quotation)
  - QT-2024-012 (Sent)
  
- **StartupXYZ** (1 quotation)
  - QT-2024-013 (Rejected)
  
- **City Government Office** (1 quotation)
  - QT-2024-014 (Accepted)

## How to Test 2-Level Grouping

1. Navigate to **Quotations** table
2. Open **View Settings**
3. Set **Primary Group By**: `Sales Person`
4. Set **Secondary Group By**: `Company`
5. Click **Save**

### Expected Result

You should see:

```
▼ Alice Chen (6)
  ├─ ▼ TechCorp Solutions (2)
  │   ├─ QT-2024-001
  │   └─ QT-2024-004
  ├─ ▼ Global Industries Ltd (2)
  │   ├─ QT-2024-005
  │   └─ QT-2024-015
  └─ ▼ StartupXYZ (2)
      ├─ QT-2024-003
      └─ QT-2024-006

▼ Bob Wilson (5)
  ├─ ▼ TechCorp Solutions (1)
  │   └─ QT-2024-007
  ├─ ▼ Global Industries Ltd (1)
  │   └─ QT-2024-002
  ├─ ▼ MegaRetail Corp (2)
  │   ├─ QT-2024-008
  │   └─ QT-2024-016
  └─ ▼ City Government Office (1)
      └─ QT-2024-009

▼ Carol Davis (4)
  ├─ ▼ StartupXYZ (2)
  │   ├─ QT-2024-011
  │   └─ QT-2024-017
  ├─ ▼ Global Industries Ltd (1)
  │   └─ QT-2024-010
  └─ ▼ MegaRetail Corp (1)
      └─ QT-2024-012

▼ David Lee (3)
  ├─ ▼ TechCorp Solutions (1)
  │   └─ QT-2024-012
  ├─ ▼ StartupXYZ (1)
  │   └─ QT-2024-013
  └─ ▼ City Government Office (1)
      └─ QT-2024-014
```

## Status Distribution

- **Draft**: 6 quotations
- **Sent**: 6 quotations
- **Accepted**: 4 quotations
- **Rejected**: 1 quotation
- **Expired**: 1 quotation

## Companies

1. **TechCorp Solutions**: 4 quotations (across 3 salespersons)
2. **Global Industries Ltd**: 4 quotations (across 3 salespersons)
3. **StartupXYZ**: 5 quotations (across 3 salespersons)
4. **MegaRetail Corp**: 2 quotations (across 2 salespersons)
5. **City Government Office**: 2 quotations (across 2 salespersons)

## Alternative Grouping Combinations

You can also try these combinations:

### 1. Group by Status → Company
Shows quotations organized by their workflow stage, then by company

### 2. Group by Company → Status
Shows all quotations for each company, organized by status

### 3. Group by Company → Sales Person
Shows each company's quotations, organized by who's handling them

## Quotation Lines Summary

Each quotation now has associated line items:

| Quotation | Lines | Products |
|-----------|-------|----------|
| QT-2024-001 | 2 | Enterprise License, Premium Support |
| QT-2024-002 | 1 | Business License |
| QT-2024-003 | 2 | Startup License, Basic Support |
| QT-2024-004 | 1 | Training Services |
| QT-2024-005 | 2 | Business License, Standard Support |
| QT-2024-006 | 1 | Startup License (Upgrade) |
| QT-2024-007 | 1 | Enterprise License (Expansion) |
| QT-2024-008 | 1 | Business License |
| QT-2024-009 | 2 | Government Edition, Implementation Services |
| QT-2024-010 | 1 | Business License |
| QT-2024-011 | 1 | Business License |
| QT-2024-012 | 2 | Training Workshop, Consulting Services |
| QT-2024-013 | 1 | Startup License |
| QT-2024-014 | 2 | Government Edition, Premium Support |
| QT-2024-015 | 1 | Business License |
| QT-2024-016 | 2 | Business License (Bulk), Standard Support |
| QT-2024-017 | 1 | Startup License |

**Total Line Items**: 24

---

**Data Updated**: December 18, 2025  
**Total Quotations**: 17  
**Total Quotation Lines**: 24  
**Ready for Testing**: ✅

